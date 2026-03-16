import config from '../../src/config/env.js';
import {
    verifyCronAuth,
    todayInRiyadh,
    nowInRiyadh,
    getDeterministicReminderTime,
} from '../../src/utils/cronHelpers.js';
import { sendEmail } from '../../src/services/email/sendNotificationEmail.js';
import { ageReminderHtml, ageReminderText } from '../../src/templates/ageReminderTemplate.js';

/**
 * Vercel Cron: runs every 5 min.
 * Checks if the current Riyadh time matches the scheduled reminder time.
 * Sends the daily age reminder exactly once.
 */
export default async function handler(req, res) {
    if (!verifyCronAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const dateStr = todayInRiyadh();
    const scheduled = getDeterministicReminderTime(dateStr);

    // Compare current time against exact 5-minute cron bucket.
    const { hour, minute } = nowInRiyadh();
    if (hour !== scheduled.hour || minute !== scheduled.minute) {
        return res.status(200).json({ skipped: true, reason: 'not yet time' });
    }

    // Build and send
    const now = new Date();
    const html = ageReminderHtml(config.birthDate, now);
    const text = ageReminderText(config.birthDate, now);
    const result = await sendEmail('⏳ Your Daily Age Reminder', html, text);

    console.log(`[dispatch] age reminder for ${dateStr}: ${result.ok ? 'sent' : 'failed'}`);
    return res.status(200).json({ sent: result.ok, date: dateStr, scheduledTime: scheduled.timeStr });
}
