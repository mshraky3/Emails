# Personal Reminder & Gold Advisory Service

A Vercel-hosted Node.js service that sends:
1. **Daily age reminder** at a random daytime time (08:00–22:00 Qassim/Riyadh).
2. **Saudi gold bullion alerts** — periodic updates every 4–5 days, plus instant alerts on big price changes (≥2% or ≥5 SAR/gram).
3. **Buy/Watch/Skip recommendation** with confidence score, reasoning, and current bullion prices.

This version runs in **stateless mode** and does **not** require Upstash Redis.

## Architecture

```
api/
  cron/
    dispatch-daily-reminder.js – every 5 min: send if time matches
    monitor-gold-price.js     – every 6h: fetch, analyze, alert
  health.js                   – status dashboard
src/
  config/env.js               – validated env config
  services/
    email/sendNotificationEmail.js
    gold/
      scrapeSaudiGoldSource.js – primary scraper
      fallbackApiSource.js     – API fallback
      normalizeBullionPrices.js
    recommendation/
      goldRecommendationEngine.js – BUY/WATCH/SKIP scorer
  templates/
    ageReminderTemplate.js
    goldAdvisoryTemplate.js
  utils/cronHelpers.js
```

## Setup

1. **Clone** and install:
   ```bash
   npm install
   ```

2. **Create `.env`** from `.env.example` and fill in:
  - Gmail app password (`EMAIL_PASS`) only is strictly required
  - Other values have defaults from your setup file
   - `CRON_SECRET` (any random string; set the same in Vercel dashboard)

3. **Deploy to Vercel:**
   ```bash
   npx vercel --prod
   ```
   Cron schedules are defined in `vercel.json`.

4. **Set environment variables** in Vercel dashboard → Settings → Environment Variables.

5. **Set CRON_SECRET** in Vercel dashboard → Settings → Cron Jobs → Secret.

## Vercel Cron Schedule

| Job | Schedule (UTC) | Purpose |
|-----|---------------|---------|
| dispatch-daily-reminder | `*/5 * * * *` | Check if it's time to send age reminder |
| monitor-gold-price | `0 3,9,15,21 * * *` | Fetch gold, check thresholds, send alerts |

## Health Check

```
GET /api/health
```

Returns JSON with today's reminder status, last gold price, and next periodic summary date.

## Testing

```bash
npm test
```

## Security Notes

- All credentials live in environment variables only — never committed.
- Cron endpoints are protected by `CRON_SECRET` bearer token.
- Rotate `EMAIL_PASS` periodically; the app password should be specific to this service.

## Minimal Env

Required:

```dotenv
EMAIL_PASS=your-gmail-app-password
```

Optional (already defaulted):

```dotenv
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=alshrakynodeapp@gmail.com
EMAIL_TO=alshraky3@gmail.com
TIMEZONE=Asia/Riyadh
```
