import { describe, it, expect } from 'vitest';
import {
    daysSince,
    getDueFollowUps,
} from '../src/services/applications/readApplications.js';

describe('applications follow-up helpers', () => {
    it('calculates days since a date in UTC days', () => {
        const now = new Date('2026-03-17T12:00:00Z');
        expect(daysSince('2026-03-10', now)).toBe(7);
    });

    it('returns null for invalid dates', () => {
        const now = new Date('2026-03-17T12:00:00Z');
        expect(daysSince('invalid-date', now)).toBeNull();
    });

    it('filters only applied jobs that passed threshold', () => {
        const now = new Date('2026-03-17T12:00:00Z');
        const applications = [
            {
                company: 'A',
                role: 'Frontend',
                appliedDate: '2026-03-01',
                status: 'applied',
            },
            {
                company: 'B',
                role: 'Backend',
                appliedDate: '2026-03-14',
                status: 'applied',
            },
            {
                company: 'C',
                role: 'Fullstack',
                appliedDate: '2026-03-01',
                status: 'interviewing',
            },
        ];

        const due = getDueFollowUps(applications, 7, now);
        expect(due).toHaveLength(1);
        expect(due[0].company).toBe('A');
    });
});
