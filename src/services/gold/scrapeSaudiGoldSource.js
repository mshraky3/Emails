import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape Saudi gold prices from saudigoldprice.com.
 * The page has a table with Arabic karat labels (عيار 24/22/21/18) and SAR/gram prices.
 *
 * Returns { karat24, karat22, karat21, karat18, currency: 'SAR', unit: 'gram', source, timestamp }
 * or throws on failure.
 */
export async function scrapeSaudiGold() {
    const url = 'https://saudigoldprice.com/';

    const { data: html } = await axios.get(url, {
        timeout: 25000,
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'ar,en;q=0.9',
        },
    });

    const $ = cheerio.load(html);

    // The gram-price table has rows: [Arabic label] [SAR price] [USD price]
    // Labels contain Arabic karat notation e.g. "سعر جرام الذهب عيار 24"
    // We also check for numeric-only karat references (24/22/21/18) in case of
    // mixed Arabic/Latin pages, and skip ounce rows (أونصة) to avoid mis-maps.
    const prices = {};
    $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;
        const label = $(cells[0]).text().trim();
        if (label.includes('أونصة') || label.includes('ounce')) return; // skip ounce rows

        // SAR price is in the second cell
        const rawSar = $(cells[1]).text().trim().replace(/[^0-9.]/g, '');
        const num = parseFloat(rawSar);
        if (isNaN(num) || num <= 0) return;

        if (/عيار\s*24|24K|karat\s*24/i.test(label)) prices.karat24 = num;
        else if (/عيار\s*22|22K|karat\s*22/i.test(label)) prices.karat22 = num;
        else if (/عيار\s*21|21K|karat\s*21/i.test(label)) prices.karat21 = num;
        else if (/عيار\s*18|18K|karat\s*18/i.test(label)) prices.karat18 = num;
    });

    if (!prices.karat24) {
        throw new Error('Scraping saudigoldprice.com failed: could not find 24K gold price');
    }

    return {
        ...prices,
        currency: 'SAR',
        unit: 'gram',
        source: 'scrape:saudigoldprice.com',
        timestamp: Date.now(),
    };
}
