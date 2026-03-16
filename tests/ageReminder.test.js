import { describe, it, expect } from 'vitest';
import { calculateAge, daysLived, ageReminderHtml } from '../src/templates/ageReminderTemplate.js';

describe('calculateAge', () => {
    it('computes correct age on a normal date', () => {
        const now = new Date('2026-03-16T12:00:00');
        const age = calculateAge('2003-11-25', now);
        expect(age.years).toBe(22);
        expect(age.months).toBe(3);
        expect(age.days).toBe(19);
    });

    it('computes age on birthday', () => {
        const now = new Date('2026-11-25T10:00:00');
        const age = calculateAge('2003-11-25', now);
        expect(age.years).toBe(23);
        expect(age.months).toBe(0);
        expect(age.days).toBe(0);
    });

    it('handles day before birthday', () => {
        const now = new Date('2026-11-24T23:59:00');
        const age = calculateAge('2003-11-25', now);
        expect(age.years).toBe(22);
        expect(age.months).toBe(11);
        expect(age.days).toBe(30);
    });

    it('handles leap year Feb 29 birth', () => {
        const now = new Date('2025-03-01T12:00:00');
        const age = calculateAge('2004-02-29', now);
        expect(age.years).toBe(21);
        expect(age.months).toBe(0);
        expect(age.days).toBe(0);
    });
});

describe('daysLived', () => {
    it('computes total days', () => {
        const now = new Date('2026-03-16T12:00:00');
        const total = daysLived('2003-11-25', now);
        expect(total).toBe(8147);
    });
});

describe('ageReminderHtml', () => {
    it('returns HTML with age info', () => {
        const html = ageReminderHtml('2003-11-25', new Date('2026-03-16T12:00:00'));
        expect(html).toContain('22 years');
        expect(html).toContain('3 months');
        expect(html).toContain('19 days');
        expect(html).toContain('8,147');
    });

    it('shows birthday message on birthday', () => {
        const html = ageReminderHtml('2003-11-25', new Date('2026-11-25T10:00:00'));
        expect(html).toContain('Happy Birthday');
    });
});
