import { describe, it, expect } from 'vitest';
import { bullionPrices } from '../src/services/gold/normalizeBullionPrices.js';

describe('bullionPrices', () => {
    it('computes correct prices for standard weights including dealer premiums', () => {
        const result = bullionPrices(300); // 300 SAR/gram spot
        expect(result).toHaveLength(6);
        // 1g  → +10%
        expect(result[0]).toEqual({ weight: '1g', price: 330 });
        // 2.5g → +5%
        expect(result[1]).toEqual({ weight: '2.5g', price: 787.5 });
        // 5g  → +4%
        expect(result[2]).toEqual({ weight: '5g', price: 1560 });
        // 10g → +2.8%
        expect(result[3]).toEqual({ weight: '10g', price: 3084 });
        // 50g → +1.5%
        expect(result[4]).toEqual({ weight: '50g', price: 15225 });
        // 100g → +1.0%
        expect(result[5]).toEqual({ weight: '100g', price: 30300 });
    });

    it('matches saudigoldprice.com actual bar prices at 603.63 SAR/g spot', () => {
        const result = bullionPrices(603.63);
        // 1g bar: site shows 663.99
        expect(result[0].price).toBeCloseTo(663.99, 0);
        // 2.5g bar: site shows 1,584.52
        expect(result[1].price).toBeCloseTo(1584.52, 0);
        // 5g bar: site shows 3,138.86
        expect(result[2].price).toBeCloseTo(3138.86, 0);
        // 10g bar: site shows 6,205.28
        expect(result[3].price).toBeCloseTo(6205.28, 0);
    });
});
