import axios from 'axios';

function dateInTimezone(dateValue, timeZone) {
    return new Date(dateValue).toLocaleDateString('en-CA', { timeZone });
}

export function countTodayEvents(events, todayDate, timeZone = 'Asia/Riyadh') {
    if (!Array.isArray(events)) return 0;
    return events.filter(
        (event) => event?.created_at && dateInTimezone(event.created_at, timeZone) === todayDate,
    ).length;
}

export function hasTodayPushEvent(events, todayDate, timeZone = 'Asia/Riyadh') {
    if (!Array.isArray(events)) return false;
    return events.some(
        (event) =>
            event?.type === 'PushEvent' &&
            event?.created_at &&
            dateInTimezone(event.created_at, timeZone) === todayDate,
    );
}

/**
 * Fetch public GitHub events and evaluate whether a push happened today.
 */
export async function fetchTodayActivity(username, token = '', timeZone = 'Asia/Riyadh') {
    if (!username) {
        throw new Error('GitHub username is required');
    }

    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'personal-reminder-service',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const { data } = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/events/public`, {
        timeout: 15000,
        headers,
    });

    const events = Array.isArray(data) ? data : [];
    const todayDate = new Date().toLocaleDateString('en-CA', { timeZone });

    return {
        username,
        todayDate,
        eventCount: countTodayEvents(events, todayDate, timeZone),
        hasCommittedToday: hasTodayPushEvent(events, todayDate, timeZone),
    };
}
