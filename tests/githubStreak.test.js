import { describe, it, expect } from 'vitest';
import {
    countTodayEvents,
    hasTodayPushEvent,
} from '../src/services/github/fetchGitHubActivity.js';

describe('GitHub activity helpers', () => {
    const today = '2026-03-17';

    it('counts only events from today in timezone', () => {
        const events = [
            { created_at: '2026-03-17T12:00:00Z' },
            { created_at: '2026-03-17T03:00:00Z' },
            { created_at: '2026-03-16T23:59:00Z' },
        ];

        const count = countTodayEvents(events, today, 'UTC');
        expect(count).toBe(2);
    });

    it('detects a push event today', () => {
        const events = [
            { type: 'WatchEvent', created_at: '2026-03-17T01:00:00Z' },
            { type: 'PushEvent', created_at: '2026-03-17T02:00:00Z' },
        ];

        expect(hasTodayPushEvent(events, today, 'UTC')).toBe(true);
    });

    it('returns false when only non-push events exist today', () => {
        const events = [
            { type: 'WatchEvent', created_at: '2026-03-17T01:00:00Z' },
            { type: 'CreateEvent', created_at: '2026-03-17T02:00:00Z' },
        ];

        expect(hasTodayPushEvent(events, today, 'UTC')).toBe(false);
    });
});
