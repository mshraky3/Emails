import { readFile } from 'node:fs/promises';

const DAY_MS = 24 * 60 * 60 * 1000;
const APPLICATIONS_FILE = new URL('../../../data/applications.json', import.meta.url);

export async function readApplications() {
    try {
        const raw = await readFile(APPLICATIONS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        if (err?.code === 'ENOENT') {
            return [];
        }
        throw new Error(`Failed to read applications data: ${err.message}`);
    }
}

export function daysSince(dateStr, now = new Date()) {
    const parsed = Date.parse(`${dateStr}T00:00:00Z`);
    if (Number.isNaN(parsed)) return null;

    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const diff = todayUtc - parsed;
    return Math.max(0, Math.floor(diff / DAY_MS));
}

export function getDueFollowUps(applications, followUpDays, now = new Date()) {
    const list = Array.isArray(applications) ? applications : [];
    const threshold = Number.isFinite(followUpDays) ? followUpDays : 7;

    return list
        .map((application) => ({
            ...application,
            daysSinceApplied: daysSince(application?.appliedDate, now),
        }))
        .filter((application) => {
            const status = String(application?.status || '').toLowerCase();
            return (
                status === 'applied' &&
                typeof application.daysSinceApplied === 'number' &&
                application.daysSinceApplied >= threshold
            );
        })
        .sort((a, b) => b.daysSinceApplied - a.daysSinceApplied);
}
