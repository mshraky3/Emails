import config from '../../src/config/env.js';
import {
    verifyCronAuth,
    todayInRiyadh,
    getDeterministicReminderTime,
} from '../../src/utils/cronHelpers.js';

/**
 * Vercel Cron: runs once daily (0 21 * * * UTC = midnight Asia/Riyadh).
 * Generates a random reminder time for today within the daytime window.
 */
export default async function handler(req, res) {
    if (!verifyCronAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const dateStr = todayInRiyadh();
    const { timeStr } = getDeterministicReminderTime(dateStr);

    console.log(`[seed] reminder for ${dateStr} resolved at ${timeStr} ${config.timezone}`);
    return res.status(200).json({ date: dateStr, scheduledTime: timeStr, timezone: config.timezone });
}
