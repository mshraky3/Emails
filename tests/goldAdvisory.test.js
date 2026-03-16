import { describe, it, expect } from 'vitest';
import { goldAdvisoryHtml, goldAdvisoryText } from '../src/templates/goldAdvisoryTemplate.js';

describe('goldAdvisoryHtml', () => {
    const samplePrices = { karat24: 310, karat22: 284.17, karat21: 271.25, karat18: 232.5, source: 'test' };
    const sampleBullion = [
        { weight: '1g', price: 310 },
        { weight: '10g', price: 3100 },
    ];
    const sampleRec = { signal: 'BUY', confidence: 72, reasons: ['Oversold zone', 'Weekly dip'] };

    it('contains signal and confidence', () => {
        const html = goldAdvisoryHtml({
            prices: samplePrices,
            bullion: sampleBullion,
            recommendation: sampleRec,
            prevPrice: null,
            trigger: 'periodic',
        });
        expect(html).toContain('BUY');
        expect(html).toContain('72%');
    });

    it('shows price change when prevPrice is provided', () => {
        const html = goldAdvisoryHtml({
            prices: samplePrices,
            bullion: sampleBullion,
            recommendation: sampleRec,
            prevPrice: { karat24: 300 },
            trigger: 'alert',
        });
        expect(html).toContain('10.00 SAR');
        expect(html).toContain('Price Alert');
    });
});

describe('goldAdvisoryText', () => {
    it('returns a plain text summary', () => {
        const text = goldAdvisoryText({
            prices: { karat24: 310, source: 'test' },
            recommendation: { signal: 'WATCH', confidence: 58, reasons: ['Fair value'] },
        });
        expect(text).toContain('WATCH');
        expect(text).toContain('58%');
    });
});
