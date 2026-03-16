/**
 * Gold bullion buy recommendation engine.
 *
 * Uses three indicators on recent daily-close history:
 *   1. MA crossover trend strength  (7-day vs 21-day SMA)
 *   2. Bollinger Band position       (20-day, 2σ)
 *   3. Weekly momentum (RSI-lite)    (7-day change)
 *
 * Outputs: { signal: 'BUY'|'WATCH'|'SKIP', confidence: 0-100, reasons: string[] }
 */

// ─── helpers ──────────────────────────────────────────

function sma(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(0, period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

function stdDev(prices, period) {
    const mean = sma(prices, period);
    if (mean === null) return null;
    const slice = prices.slice(0, period);
    const sq = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
    return Math.sqrt(sq);
}

// ─── indicator scorers ────────────────────────────────

function trendScore(prices) {
    const maShort = sma(prices, 7);
    const maLong = sma(prices, 21);
    if (maShort === null || maLong === null) return { score: 50, reason: 'Insufficient data for trend' };

    const diff = ((maShort - maLong) / maLong) * 100;

    let score;
    let reason;
    if (diff < -2.5) {
        score = 70;
        reason = `Bearish trend (MA7 ${diff.toFixed(1)}% below MA21) — potential dip-buy zone`;
    } else if (diff < 0) {
        score = 55;
        reason = `Mild downtrend (${diff.toFixed(1)}%) — price weakening`;
    } else if (diff <= 1) {
        score = 45;
        reason = `Consolidating near moving averages`;
    } else {
        score = 30;
        reason = `Strong uptrend (+${diff.toFixed(1)}%) — may be overextended`;
    }
    return { score, reason };
}

function momentumScore(prices) {
    const ma20 = sma(prices, 20);
    const sd20 = stdDev(prices, 20);
    if (ma20 === null || sd20 === null) return { score: 50, reason: 'Insufficient data for bands' };

    const upper = ma20 + 2 * sd20;
    const lower = ma20 - 2 * sd20;
    const current = prices[0];
    const pos = (current - lower) / (upper - lower);

    let score;
    let reason;
    if (pos < 0.2) {
        score = 75;
        reason = `Price near lower Bollinger Band (oversold zone at ${(pos * 100).toFixed(0)}%)`;
    } else if (pos < 0.35) {
        score = 60;
        reason = `Below midrange of volatility band — undervalued`;
    } else if (pos < 0.65) {
        score = 40;
        reason = `Fair value range within Bollinger Bands`;
    } else {
        score = 20;
        reason = `Near upper band (overbought at ${(pos * 100).toFixed(0)}%)`;
    }
    return { score, reason };
}

function weeklyMomentumScore(prices) {
    if (prices.length < 7) return { score: 50, reason: 'Insufficient data for weekly momentum' };

    const change = ((prices[0] - prices[6]) / prices[6]) * 100;

    let score;
    let reason;
    if (change < -3) {
        score = 70;
        reason = `Weekly drop of ${change.toFixed(1)}% — oversold momentum`;
    } else if (change < 0) {
        score = 55;
        reason = `Mild weekly decline (${change.toFixed(1)}%)`;
    } else if (change <= 2) {
        score = 40;
        reason = `Stable weekly movement (+${change.toFixed(1)}%)`;
    } else {
        score = 25;
        reason = `Strong weekly rally (+${change.toFixed(1)}%) — caution`;
    }
    return { score, reason };
}

// ─── anti-noise guards ───────────────────────────────

function applyGuards(confidence, prices, lastAlertTime) {
    const reasons = [];

    // Guard 1: cooldown (3 days since last alert)
    if (lastAlertTime && Date.now() - lastAlertTime < 3 * 24 * 60 * 60 * 1000) {
        reasons.push('Cooldown active (alert sent < 3 days ago)');
        return { confidence: 0, reasons };
    }

    // Guard 2: daily spike > 2.5% → discount confidence
    if (prices.length >= 2) {
        const dailyChange = Math.abs((prices[0] - prices[1]) / prices[1]) * 100;
        if (dailyChange > 2.5) {
            confidence *= 0.6;
            reasons.push(`Spike guard: ${dailyChange.toFixed(1)}% daily move discounted`);
        }
    }

    // Guard 3: high volatility environment → raise threshold
    const sd = stdDev(prices, 20);
    const ma = sma(prices, 20);
    if (sd !== null && ma !== null) {
        const vol = (sd / ma) * 100;
        if (vol > 3.5) {
            confidence *= 0.85;
            reasons.push(`High volatility (${vol.toFixed(1)}%) — threshold raised`);
        }
    }

    return { confidence, reasons };
}

// ─── main entry ──────────────────────────────────────

/**
 * Evaluate gold buy recommendation.
 *
 * @param {number[]} priceHistory - daily prices (newest first), SAR/gram 24K, minimum 7 entries
 * @param {number|null} lastAlertTime - epoch ms of last BUY alert sent
 * @returns {{ signal: string, confidence: number, reasons: string[] }}
 */
export function evaluateGold(priceHistory, lastAlertTime = null) {
    if (!priceHistory || priceHistory.length < 7) {
        return {
            signal: 'SKIP',
            confidence: 0,
            reasons: ['Not enough price history yet (need at least 7 days)'],
        };
    }

    const t = trendScore(priceHistory);
    const m = momentumScore(priceHistory);
    const w = weeklyMomentumScore(priceHistory);

    let confidence = 0.35 * t.score + 0.4 * m.score + 0.25 * w.score;
    const allReasons = [t.reason, m.reason, w.reason];

    const guards = applyGuards(confidence, priceHistory, lastAlertTime);
    confidence = guards.confidence;
    allReasons.push(...guards.reasons);

    let signal;
    if (confidence >= 65) signal = 'BUY';
    else if (confidence >= 55) signal = 'WATCH';
    else signal = 'SKIP';

    return {
        signal,
        confidence: Math.round(confidence),
        reasons: allReasons.filter(Boolean),
    };
}
