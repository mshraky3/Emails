/**
 * Build professional gold advisory HTML email.
 *
 * @param {object} params
 * @param {object} params.prices      - { karat24, karat22, karat21, karat18, source }
 * @param {{ weight: string, price: number }[]} params.bullion - bullion unit prices
 * @param {{ signal: string, confidence: number, reasons: string[] }} params.recommendation
 * @param {object|null} params.prevPrice - previous price snapshot (for change display)
 * @param {'periodic'|'alert'} params.trigger - why this email was sent
 */
export function goldAdvisoryHtml({ prices, bullion, recommendation, prevPrice, trigger }) {
  const signalColors = { BUY: '#27ae60', WATCH: '#f39c12', SKIP: '#95a5a6' };
  const signalEmoji = { BUY: '🟢', WATCH: '🟡', SKIP: '⚪' };
  const color = signalColors[recommendation.signal] || '#555';
  const emoji = signalEmoji[recommendation.signal] || '';

  const changeHtml = prevPrice
    ? (() => {
        const diff = prices.karat24 - prevPrice.karat24;
        const pct = ((diff / prevPrice.karat24) * 100).toFixed(2);
        const arrow = diff >= 0 ? '▲' : '▼';
        const clr = diff >= 0 ? '#e74c3c' : '#27ae60';
        return `<span style="color:${clr};font-weight:600;">${arrow} ${Math.abs(diff).toFixed(2)} SAR (${pct}%)</span>`;
      })()
    : '';

  const triggerLabel = trigger === 'alert' ? '⚠️ Price Alert' : '📊 Periodic Update';

  const dateStr = new Date().toLocaleDateString('en-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh',
  });

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2 style="margin-bottom: 4px;">🪙 Gold Advisory — ${triggerLabel}</h2>
  <p style="color: #7f8c8d; margin-top: 0;">${dateStr}</p>

  <!-- Signal badge -->
  <div style="background: ${color}; color: #fff; display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 1.3em; font-weight: 700; margin: 12px 0;">
    ${emoji} ${recommendation.signal} &nbsp;·&nbsp; Confidence ${recommendation.confidence}%
  </div>

  <!-- Karat prices -->
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr style="background: #f8f9fa;">
      <th style="text-align: left; padding: 8px;">Karat</th>
      <th style="text-align: right; padding: 8px;">SAR / gram</th>
    </tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">24K (Pure)</td><td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${prices.karat24}</td></tr>
    ${prices.karat22 ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">22K</td><td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">${prices.karat22}</td></tr>` : ''}
    ${prices.karat21 ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">21K</td><td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">${prices.karat21}</td></tr>` : ''}
    ${prices.karat18 ? `<tr><td style="padding: 8px;">18K</td><td style="text-align: right; padding: 8px;">${prices.karat18}</td></tr>` : ''}
  </table>

  ${changeHtml ? `<p>Change from last check: ${changeHtml}</p>` : ''}

  <!-- Bullion prices -->
  <h3 style="margin-bottom: 8px;">Gold Bullion Prices (24K)</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr style="background: #f8f9fa;">
      <th style="text-align: left; padding: 6px;">Weight</th>
      <th style="text-align: right; padding: 6px;">Price (SAR)</th>
    </tr>
    ${bullion.map((b) => `<tr><td style="padding: 6px; border-bottom: 1px solid #eee;">${b.weight} bar</td><td style="text-align: right; padding: 6px; border-bottom: 1px solid #eee;">${b.price.toLocaleString()}</td></tr>`).join('')}
  </table>

  <!-- Reasoning -->
  <h3 style="margin-bottom: 8px;">Analysis</h3>
  <ul style="padding-left: 20px; color: #444;">
    ${recommendation.reasons.map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
  </ul>

  <p style="color: #aaa; font-size: 0.8em; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
    Source: ${prices.source} &middot; This is informational only, not financial advice.
  </p>
</body>
</html>`;
}

/**
 * Plain-text version.
 */
export function goldAdvisoryText({ prices, recommendation }) {
  return `Gold Advisory — Signal: ${recommendation.signal} (Confidence ${recommendation.confidence}%)
24K: ${prices.karat24} SAR/g | Reasons: ${recommendation.reasons.join('; ')}
This is informational only, not financial advice.`;
}
