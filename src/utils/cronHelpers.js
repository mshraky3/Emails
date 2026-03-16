import config from '../config/env.js';

/**
 * Verify Vercel cron secret header.
 * Returns true if valid, false otherwise.
 */
export function verifyCronAuth(req) {
    if (!config.cronSecret) return true; // no secret configured → allow (dev mode)
    return req.headers['authorization'] === `Bearer ${config.cronSecret}`;
}

/**
 * Get the current date string (YYYY-MM-DD) in configured timezone.
 */
export function todayInRiyadh() {
    return new Date().toLocaleDateString('en-CA', { timeZone: config.timezone });
}

/**
 * Get current hour and minute in configured timezone.
 */
export function nowInRiyadh() {
    const parts = new Date()
        .toLocaleTimeString('en-GB', { timeZone: config.timezone, hour12: false })
        .split(':');
    return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
}

/**
 * Stable integer hash for deterministic daily scheduling.
 */
export function stableHash(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash +=
            (hash << 1) +
            (hash << 4) +
            (hash << 7) +
            (hash << 8) +
            (hash << 24);
    }
    return Math.abs(hash >>> 0);
}

/**
 * Deterministic reminder time for a given date, aligned to 5-minute cron buckets.
 */
export function getDeterministicReminderTime(dateStr) {
    const start = config.reminderWindowStart;
    const end = config.reminderWindowEnd;
    const range = Math.max(1, end - start);

    const seed = `${dateStr}|${config.birthDate}|${config.email.to}`;
    const hash = stableHash(seed);

    const hour = start + (hash % range);
    const rawMinute = Math.floor(hash / range) % 60;
    const minute = Math.floor(rawMinute / 5) * 5;

    return {
        hour,
        minute,
        timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
}

/**
 * Stateless 4-5 day cadence using repeating 9-day cycle (days 0 and 4).
 */
export function isPeriodicCycleDay(dateStr) {
    const anchorUtc = Date.parse('2026-01-01T00:00:00Z');
    const targetUtc = Date.parse(`${dateStr}T00:00:00Z`);
    const days = Math.floor((targetUtc - anchorUtc) / (24 * 60 * 60 * 1000));
    const cycle = ((days % 9) + 9) % 9;
    return cycle === 0 || cycle === 4;
}
