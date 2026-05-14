import axios from 'axios';
import * as cheerio from 'cheerio';

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeKeywords(keywords) {
    if (!Array.isArray(keywords)) return [];
    return keywords.map((keyword) => String(keyword).trim().toLowerCase()).filter(Boolean);
}

function includesAnyKeyword(text, keywords) {
    const normalizedText = String(text || '').toLowerCase();
    if (keywords.length === 0) return true;
    return keywords.some((keyword) => normalizedText.includes(keyword));
}

function isWithinLastDay(dateString, now = new Date()) {
    const ts = Date.parse(dateString);
    if (Number.isNaN(ts)) return false;
    const ageMs = now.getTime() - ts;
    return ageMs >= 0 && ageMs <= DAY_MS;
}

export function extractCompanyFromTitle(title) {
    const value = String(title || '').trim();
    const match = value.match(/\s(?:at|@)\s(.+)$/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    return 'Unknown';
}

export function parseWuzzufFeed(xml, keywords, now = new Date()) {
    const normalizedKeywords = normalizeKeywords(keywords);
    const $ = cheerio.load(String(xml || ''), { xmlMode: true });
    const jobs = [];

    $('item').each((_, item) => {
        const title = $(item).find('title').first().text().trim();
        const url = $(item).find('link').first().text().trim();
        const postedAt = $(item).find('pubDate').first().text().trim();
        const description = $(item).find('description').first().text().trim();

        const searchable = `${title} ${description}`;
        if (!title || !url) return;
        if (!isWithinLastDay(postedAt, now)) return;
        if (!includesAnyKeyword(searchable, normalizedKeywords)) return;

        jobs.push({
            title,
            company: extractCompanyFromTitle(title),
            url,
            tags: ['Saudi Arabia'],
            postedAt,
            source: 'wuzzuf',
        });
    });

    return jobs;
}

export async function fetchWuzzufJobs(keywords) {
    const { data } = await axios.get('https://wuzzuf.net/search/jobs/feed/?q=software+engineer&l=saudi+arabia', {
        timeout: 20000,
        headers: {
            Accept: 'application/rss+xml,application/xml,text/xml',
        },
    });

    return parseWuzzufFeed(data, keywords);
}
