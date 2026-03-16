import config from '../../src/config/env.js';
import { verifyCronAuth } from '../../src/utils/cronHelpers.js';
import { fetchRemotiveJobs } from '../../src/services/jobs/fetchRemotiveJobs.js';
import { fetchWuzzufJobs } from '../../src/services/jobs/fetchWuzzufJobs.js';
import { sendEmail } from '../../src/services/email/sendNotificationEmail.js';
import {
    jobDigestHtml,
    jobDigestText,
} from '../../src/templates/jobDigestTemplate.js';

function dedupeByUrl(jobs) {
    const seen = new Set();
    return jobs.filter((job) => {
        if (!job?.url) return false;
        if (seen.has(job.url)) return false;
        seen.add(job.url);
        return true;
    });
}

export default async function handler(req, res) {
    if (!verifyCronAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const keywords = config.jobs.keywords;
    const [remoteResult, saudiResult] = await Promise.allSettled([
        fetchRemotiveJobs(keywords),
        fetchWuzzufJobs(keywords),
    ]);

    const jobs = [];
    if (remoteResult.status === 'fulfilled') jobs.push(...remoteResult.value);
    if (saudiResult.status === 'fulfilled') jobs.push(...saudiResult.value);

    const dedupedJobs = dedupeByUrl(jobs);
    if (dedupedJobs.length === 0) {
        return res.status(200).json({
            skipped: true,
            reason: 'no matching jobs in last 24h',
            remotiveStatus: remoteResult.status,
            wuzzufStatus: saudiResult.status,
        });
    }

    const dateText = new Date().toLocaleDateString('en-CA', {
        timeZone: config.timezone,
    });
    const subject = `📋 ${dedupedJobs.length} new job matches - ${dateText}`;
    const html = jobDigestHtml(dedupedJobs);
    const text = jobDigestText(dedupedJobs);
    const result = await sendEmail(subject, html, text);

    return res.status(200).json({
        sent: result.ok,
        total: dedupedJobs.length,
        remotive: remoteResult.status,
        wuzzuf: saudiResult.status,
    });
}
