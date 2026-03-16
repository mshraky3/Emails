import { describe, it, expect } from 'vitest';
import { evaluateGold } from '../src/services/recommendation/goldRecommendationEngine.js';

// Helper: generate synthetic price history (newest first)
function generatePrices(base, count, trend = 0) {
    return Array.from({ length: count }, (_, i) => base - trend * i + (Math.sin(i) * 0.5));
}

describe('evaluateGold', () => {
    it('returns SKIP when not enough data', () => {
        const result = evaluateGold([100, 101, 102], null);
        expect(result.signal).toBe('SKIP');
        expect(result.confidence).toBe(0);
    });

    it('returns a valid signal with sufficient data', () => {
        const prices = generatePrices(300, 30, 0.5); // gentle downtrend
        const result = evaluateGold(prices, null);
        expect(['BUY', 'WATCH', 'SKIP']).toContain(result.signal);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
        expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('suppresses alert during cooldown', () => {
        const prices = generatePrices(300, 30, 1); // strong downtrend → would normally be BUY
        const recentAlert = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 day ago
        const result = evaluateGold(prices, recentAlert);
        expect(result.confidence).toBe(0);
        expect(result.reasons).toContain('Cooldown active (alert sent < 3 days ago)');
    });

    it('returns BUY-like signal on strong dip', () => {
        // Simulate oversold: recent prices well below 21-day MA
        const prices = [
            250, 252, 254, 256, 258, 260, 262,   // recent: low
            280, 282, 284, 286, 288, 290, 292,    // older: higher
            294, 296, 298, 300, 302, 304, 306,
            308, 310, 312, 314, 316, 318, 320, 322, 324,
        ];
        const result = evaluateGold(prices, null);
        // Should lean toward BUY or at least WATCH
        expect(['BUY', 'WATCH']).toContain(result.signal);
    });

    it('includes all three indicator reasons', () => {
        const prices = generatePrices(300, 25);
        const result = evaluateGold(prices, null);
        // At least 3 reasons from the three indicators
        expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    });
});
