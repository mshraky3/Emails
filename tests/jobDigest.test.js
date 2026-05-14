import { describe, it, expect } from 'vitest';
import {
    filterRemotiveJobs,
    includesAnyKeyword,
} from '../src/services/jobs/fetchRemotiveJobs.js';
import { parseWuzzufFeed } from '../src/services/jobs/fetchWuzzufJobs.js';

describe('job filtering', () => {
    it('matches keywords case-insensitively', () => {
        expect(includesAnyKeyword('Senior React Developer', ['react'])).toBe(true);
        expect(includesAnyKeyword('Backend Engineer', ['react'])).toBe(false);
    });

    it('filters remotive jobs by 24h and keywords', () => {
        const now = new Date('2026-03-17T12:00:00Z');
        const jobs = [
            {
                title: 'React Engineer',
                company_name: 'A',
                url: 'https://example.com/1',
                tags: ['JavaScript'],
                publication_date: '2026-03-17T08:00:00Z',
            },
            {
                title: 'Data Analyst',
                company_name: 'B',
                url: 'https://example.com/2',
                tags: ['SQL'],
                publication_date: '2026-03-17T08:00:00Z',
            },
            {
                title: 'Node.js Engineer',
                company_name: 'C',
                url: 'https://example.com/3',
                tags: ['Node.js'],
                publication_date: '2026-03-15T08:00:00Z',
            },
        ];

        const result = filterRemotiveJobs(jobs, ['React', 'Node.js'], now);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('React Engineer');
    });

    it('excludes future-dated remotive jobs', () => {
        const now = new Date('2026-03-17T12:00:00Z');
        const jobs = [
            {
                title: 'React Engineer',
                company_name: 'A',
                url: 'https://example.com/1',
                tags: ['React'],
                publication_date: '2026-03-17T13:00:00Z',
            },
        ];

        const result = filterRemotiveJobs(jobs, ['React'], now);
        expect(result).toHaveLength(0);
    });

    it('parses and filters wuzzuf rss feed', () => {
        const xml = `<?xml version="1.0"?><rss><channel>
            <item>
                <title>Frontend Developer at Company X</title>
                <link>https://wuzzuf.net/jobs/p/1</link>
                <pubDate>Tue, 17 Mar 2026 08:00:00 GMT</pubDate>
                <description>React and TypeScript required</description>
            </item>
            <item>
                <title>HR Specialist at Company Y</title>
                <link>https://wuzzuf.net/jobs/p/2</link>
                <pubDate>Tue, 17 Mar 2026 08:00:00 GMT</pubDate>
                <description>People operations</description>
            </item>
        </channel></rss>`;

        const now = new Date('2026-03-17T12:00:00Z');
        const result = parseWuzzufFeed(xml, ['React', 'Node.js'], now);
        expect(result).toHaveLength(1);
        expect(result[0].title).toContain('Frontend Developer');
    });
});
