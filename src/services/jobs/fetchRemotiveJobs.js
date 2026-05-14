import axios from 'axios';

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeKeywords(keywords) {
    if (!Array.isArray(keywords)) return [];
    return keywords.map((keyword) => String(keyword).trim().toLowerCase()).filter(Boolean);
}

export function includesAnyKeyword(text, keywords) {
    const normalizedText = String(text || '').toLowerCase();
    if (keywords.length === 0) return true;
    return keywords.some((keyword) => normalizedText.includes(keyword));
}

export function isWithinLastDay(dateString, now = new Date()) {
    const ts = Date.parse(dateString);
    if (Number.isNaN(ts)) return false;
    const ageMs = now.getTime() - ts;
    return ageMs >= 0 && ageMs <= DAY_MS;
}

export function filterRemotiveJobs(rawJobs, keywords, now = new Date()) {
    const list = Array.isArray(rawJobs) ? rawJobs : [];
    const normalizedKeywords = normalizeKeywords(keywords);

    return list
        .filter((job) => {
            const searchable = `${job?.title || ''} ${(job?.tags || []).join(' ')}`;
            return (
                isWithinLastDay(job?.publication_date, now) &&
                includesAnyKeyword(searchable, normalizedKeywords)
            );
        })
        .map((job) => ({
            title: String(job?.title || '').trim(),
            company: String(job?.company_name || 'Unknown').trim(),
            url: String(job?.url || '').trim(),
            tags: Array.isArray(job?.tags) ? job.tags : [],
            postedAt: job?.publication_date,
            source: 'remotive',
        }))
        .filter((job) => job.title && job.url);
}

export async function fetchRemotiveJobs(keywords) {
    const { data } = await axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=100', {
        timeout: 20000,
    });

    return filterRemotiveJobs(data?.jobs || [], keywords);
}
