import axios from 'axios';
import { scrapeSaudiGold } from './scrapeSaudiGoldSource.js';
import { fetchGoldFallback } from './fallbackApiSource.js';

/**
 * Fetch Saudi gold bullion prices.
 * Tries scraping first, then falls back to API.
 * Returns normalized price object or null if both fail.
 */
export async function fetchBullionPrices() {
    // Primary: local Saudi scrape
    try {
        const data = await scrapeSaudiGold();
        if (data.karat24 > 0) {
            console.log(`[gold] scraped 24K: ${data.karat24} SAR/g`);
            return data;
        }
    } catch (err) {
        console.warn(`[gold] scrape failed: ${err.message}`);
    }

    // Fallback: API
    try {
        const data = await fetchGoldFallback();
        console.log(`[gold] fallback API 24K: ${data.karat24} SAR/g`);
        return data;
    } catch (err) {
        console.error(`[gold] fallback API also failed: ${err.message}`);
        return null;
    }
}

/**
 * Standard bullion bar prices sold in Saudi Arabia (999.9 / 24K).
 * Each bar size carries a fabrication + dealer premium over the spot gram price.
 * Premiums calibrated against saudigoldprice.com typical market data:
 *   1g  → ~10%   (1g bars command the highest premium)
 *   2.5g → ~5%
 *   5g  → ~4%
 *   10g → ~2.8%
 *   50g → ~1.5%
 *   100g → ~1.0%
 */
export function bullionPrices(pricePerGram24K) {
    const bars = [
        { weight: '1g', grams: 1, premiumPct: 0.100 },
        { weight: '2.5g', grams: 2.5, premiumPct: 0.050 },
        { weight: '5g', grams: 5, premiumPct: 0.040 },
        { weight: '10g', grams: 10, premiumPct: 0.028 },
        { weight: '50g', grams: 50, premiumPct: 0.015 },
        { weight: '100g', grams: 100, premiumPct: 0.010 },
    ];
    return bars.map(({ weight, grams, premiumPct }) => ({
        weight,
        price: parseFloat((pricePerGram24K * grams * (1 + premiumPct)).toFixed(2)),
    }));
}

/**
 * Fetch global gold daily close series (newest first) for trend/change analysis.
 */
export async function fetchGoldHistorySeries(limit = 40) {
    const { data } = await axios.get('https://stooq.com/q/d/l/?s=xauusd&i=d', {
        timeout: 15000,
    });

    const lines = String(data).trim().split(/\r?\n/);
    if (lines.length < 3) {
        throw new Error('Historical gold series unavailable');
    }

    const closes = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 5) continue;
        const close = parseFloat(parts[4]);
        if (!Number.isNaN(close) && close > 0) closes.push(close);
    }

    if (closes.length < 2) {
        throw new Error('Not enough historical data points');
    }

    return closes.slice(-limit).reverse();
}
