import axios from 'axios';

/**
 * Fallback: fetch global gold spot price and convert to SAR/gram via free API.
 *
 * Uses metals.dev free endpoint for XAU/USD and exchangerate-api for USD→SAR.
 * Returns normalized { karat24, currency: 'SAR', unit: 'gram', source, timestamp }
 */
export async function fetchGoldFallback() {
    // 1. Get gold spot price in USD per troy ounce
    const { data: metalData } = await axios.get(
        'https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz',
        { timeout: 15000 },
    );

    let goldUsdOz = metalData?.metals?.gold;
    if (!goldUsdOz) {
        // Secondary attempt with metals.live (no key needed)
        const { data: liveData } = await axios.get(
            'https://api.metals.live/v1/spot/gold',
            { timeout: 10000 },
        );
        goldUsdOz = Array.isArray(liveData) ? liveData[0]?.price : liveData?.price;
    }

    if (!goldUsdOz || goldUsdOz <= 0) {
        throw new Error('Fallback API: could not get gold spot price');
    }

    // 2. Get USD→SAR rate (SAR is pegged ~3.75 but fetch live for accuracy)
    let usdToSar = 3.75; // safe default (peg)
    try {
        const { data: fxData } = await axios.get(
            'https://open.er-api.com/v6/latest/USD',
            { timeout: 10000 },
        );
        if (fxData?.rates?.SAR) usdToSar = fxData.rates.SAR;
    } catch {
        // pegged rate is reliable enough as fallback
    }

    // 3. Convert: 1 troy oz = 31.1035 grams
    const goldSarGram24 = (goldUsdOz * usdToSar) / 31.1035;

    return {
        karat24: parseFloat(goldSarGram24.toFixed(2)),
        karat22: parseFloat(((goldSarGram24 * 22) / 24).toFixed(2)),
        karat21: parseFloat(((goldSarGram24 * 21) / 24).toFixed(2)),
        karat18: parseFloat(((goldSarGram24 * 18) / 24).toFixed(2)),
        currency: 'SAR',
        unit: 'gram',
        source: 'api:metals+forex',
        timestamp: Date.now(),
    };
}
