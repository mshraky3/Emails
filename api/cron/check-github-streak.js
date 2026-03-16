import config from '../../src/config/env.js';
import { verifyCronAuth } from '../../src/utils/cronHelpers.js';
import { fetchTodayActivity } from '../../src/services/github/fetchGitHubActivity.js';
import { sendEmail } from '../../src/services/email/sendNotificationEmail.js';
import {
    streakNudgeHtml,
    streakNudgeText,
} from '../../src/templates/streakNudgeTemplate.js';

export default async function handler(req, res) {
    if (!verifyCronAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const activity = await fetchTodayActivity(
            config.github.username,
            config.github.token,
            config.timezone,
        );

        if (activity.hasCommittedToday) {
            return res.status(200).json({
                skipped: true,
                reason: 'already committed today',
                username: activity.username,
                date: activity.todayDate,
                eventCount: activity.eventCount,
            });
        }

        const subject = '🔥 No commit yet today - streak at risk!';
        const html = streakNudgeHtml(activity.username);
        const text = streakNudgeText(activity.username);
        const result = await sendEmail(subject, html, text);

        return res.status(200).json({
            sent: result.ok,
            username: activity.username,
            date: activity.todayDate,
            eventCount: activity.eventCount,
        });
    } catch (err) {
        console.error(`[github-streak] ${err.message}`);
        return res.status(200).json({ error: 'github activity unavailable' });
    }
}
