const memory = {
    reminderTimes: new Map(),
    reminderSent: new Set(),
    lastGoldPrice: null,
    goldHistory: [],
    lastGoldAlert: null,
    nextPeriodicSummary: null,
};

// Keys
const KEYS = {
    reminderTime: (date) => `reminder:time:${date}`,
    reminderSent: (date) => `reminder:sent:${date}`,
    lastGoldPrice: 'gold:last_price',
    goldHistory: 'gold:history',
    lastGoldAlert: 'gold:last_alert_time',
    nextPeriodicSummary: 'gold:next_periodic',
};

/** Store today's random reminder time (HH:MM in Asia/Riyadh) */
export async function setReminderTime(dateStr, timeStr) {
    memory.reminderTimes.set(KEYS.reminderTime(dateStr), timeStr);
}

/** Get today's stored reminder time */
export async function getReminderTime(dateStr) {
    return memory.reminderTimes.get(KEYS.reminderTime(dateStr)) || null;
}

/** Mark today's reminder as sent */
export async function markReminderSent(dateStr) {
    memory.reminderSent.add(KEYS.reminderSent(dateStr));
}

/** Check if today's reminder was already sent */
export async function isReminderSent(dateStr) {
    return memory.reminderSent.has(KEYS.reminderSent(dateStr));
}

/** Store latest gold price (SAR/gram) */
export async function setLastGoldPrice(priceData) {
    memory.lastGoldPrice = priceData;
}

/** Get last stored gold price */
export async function getLastGoldPrice() {
    return memory.lastGoldPrice;
}

/** Append price to history list (keep last 90 entries) */
export async function appendGoldHistory(entry) {
    memory.goldHistory.unshift(entry);
    memory.goldHistory = memory.goldHistory.slice(0, 90);
}

/** Get gold price history (newest first) */
export async function getGoldHistory(count = 40) {
    return memory.goldHistory.slice(0, count);
}

/** Get/set last gold alert timestamp */
export async function getLastGoldAlertTime() {
    return memory.lastGoldAlert;
}

export async function setLastGoldAlertTime(ts) {
    memory.lastGoldAlert = ts;
}

/** Get/set next periodic summary date (YYYY-MM-DD) */
export async function getNextPeriodicDate() {
    return memory.nextPeriodicSummary;
}

export async function setNextPeriodicDate(dateStr) {
    memory.nextPeriodicSummary = dateStr;
}

export const redis = null;
