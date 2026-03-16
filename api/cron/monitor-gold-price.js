import config from '../../src/config/env.js';
import {
    verifyCronAuth,
    todayInRiyadh,
    isPeriodicCycleDay,
} from '../../src/utils/cronHelpers.js';
import {
    fetchBullionPrices,
    bullionPrices,
    fetchGoldHistorySeries,
} from '../../src/services/gold/normalizeBullionPrices.js';
import { evaluateGold } from '../../src/services/recommendation/goldRecommendationEngine.js';
import { sendEmail } from '../../src/services/email/sendNotificationEmail.js';
import { goldAdvisoryHtml, goldAdvisoryText } from '../../src/templates/goldAdvisoryTemplate.js';

/**
 * Vercel Cron: runs every 6 hours.
 *
 * 1. Fetches latest Saudi gold prices (scrape → API fallback).
 * 2. Checks for big daily change using historical close series.
 * 3. Triggers periodic summary on deterministic 4-5 day cadence.
 * 4. Runs recommendation engine and sends email if conditions met.
 */
export default async function handler(req, res) {
    if (!verifyCronAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = todayInRiyadh();

    // ── 1) Fetch current local price ──────────────────
    const prices = await fetchBullionPrices();
    if (!prices) {
        console.error('[gold-monitor] both sources failed');
        return res.status(200).json({ error: 'data unavailable' });
    }

    // ── 2) Fetch historical series for stateless analysis ─────────────────────
    let historyPrices = [];
    try {
        historyPrices = await fetchGoldHistorySeries(45);
    } catch (err) {
        console.warn(`[gold-monitor] historical series unavailable: ${err.message}`);
    }

    if (historyPrices.length < 2) {
        // Fallback to local price only so recommendation engine can still run.
        historyPrices = [prices.karat24, prices.karat24 * 1.005, prices.karat24 * 1.01];
    }

    const latestRef = historyPrices[0];
    const prevRef = historyPrices[1];
    const pctChange = prevRef > 0 ? ((latestRef - prevRef) / prevRef) * 100 : 0;

    // Estimate local absolute change from reference percent move.
    const estimatedAbsChange = Math.abs((prices.karat24 * pctChange) / 100);
    const isBigChange =
        Math.abs(pctChange) >= config.gold.changePercentThreshold ||
        estimatedAbsChange >= config.gold.changeAbsoluteThreshold;

    // ── 3) Deterministic periodic cadence (4,5,4,5...) ───────────────────────
    const isPeriodicDue = isPeriodicCycleDay(today);

    // ── 4) Decide whether to send ─────────────────────────────────────────────
    if (!isBigChange && !isPeriodicDue) {
        return res.status(200).json({
            action: 'none',
            price24k: prices.karat24,
            pctChange: Number(pctChange.toFixed(2)),
        });
    }

    // Run recommendation engine from historical series.
    const recommendation = evaluateGold(historyPrices, null);

    const estimatedPrevKarat24 =
        pctChange === -100
            ? null
            : parseFloat((prices.karat24 / (1 + pctChange / 100)).toFixed(2));
    const prevPrice = estimatedPrevKarat24
        ? {
            karat24: estimatedPrevKarat24,
            source: 'estimated:daily-change',
            timestamp: Date.now() - 24 * 60 * 60 * 1000,
        }
        : null;

    const bullion = bullionPrices(prices.karat24);
    const trigger = isBigChange ? 'alert' : 'periodic';

    const html = goldAdvisoryHtml({ prices, bullion, recommendation, prevPrice, trigger });
    const text = goldAdvisoryText({ prices, recommendation });

    const subject = isBigChange
        ? `⚠️ Gold Price Alert — ${recommendation.signal} (${recommendation.confidence}%)`
        : `📊 Gold Update — ${recommendation.signal} (${recommendation.confidence}%)`;

    const result = await sendEmail(subject, html, text);

    console.log(`[gold-monitor] ${trigger} email: ${result.ok ? 'sent' : 'failed'} — ${recommendation.signal}`);
    return res.status(200).json({
        trigger,
        signal: recommendation.signal,
        confidence: recommendation.confidence,
        pctChange: Number(pctChange.toFixed(2)),
        sent: result.ok,
    });
}
