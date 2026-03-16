import {
    todayInRiyadh,
    getDeterministicReminderTime,
    isPeriodicCycleDay,
} from '../src/utils/cronHelpers.js';

/**
 * Health / status endpoint.
 * GET /api/health → JSON summary of system state.
 */
export default async function handler(req, res) {
    const today = todayInRiyadh();
    const reminder = getDeterministicReminderTime(today);

    return res.status(200).json({
        status: 'ok',
        mode: 'stateless-no-redis',
        today,
        ageReminder: {
            scheduledTime: reminder.timeStr,
            sent: 'stateless (sent only on exact scheduled cron minute)',
        },
        gold: {
            periodicDueToday: isPeriodicCycleDay(today),
            lastPrice: 'stateless (evaluated during monitor job)',
        },
    });
}
