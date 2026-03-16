import config from '../../src/config/env.js';
import { verifyCronAuth } from '../../src/utils/cronHelpers.js';
import {
    readApplications,
    getDueFollowUps,
} from '../../src/services/applications/readApplications.js';
import { sendEmail } from '../../src/services/email/sendNotificationEmail.js';
import {
    applicationNudgeHtml,
    applicationNudgeText,
} from '../../src/templates/applicationNudgeTemplate.js';

export default async function handler(req, res) {
    if (!verifyCronAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const applications = await readApplications();
        const due = getDueFollowUps(
            applications,
            config.application.followUpDays,
        );

        if (due.length === 0) {
            return res.status(200).json({
                skipped: true,
                reason: 'no applications due for follow-up',
                totalApplications: applications.length,
                thresholdDays: config.application.followUpDays,
            });
        }

        const subject = `📬 Follow up on ${due.length} job application(s)`;
        const html = applicationNudgeHtml(due);
        const text = applicationNudgeText(due);
        const result = await sendEmail(subject, html, text);

        return res.status(200).json({
            sent: result.ok,
            dueCount: due.length,
            thresholdDays: config.application.followUpDays,
        });
    } catch (err) {
        console.error(`[applications-followup] ${err.message}`);
        return res.status(200).json({ error: 'applications data unavailable' });
    }
}
