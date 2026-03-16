import config from '../src/config/env.js';
import { sendEmail } from '../src/services/email/sendNotificationEmail.js';

function getQueryParam(req, name) {
    if (req?.query && typeof req.query[name] !== 'undefined') {
        return req.query[name];
    }

    try {
        const parsed = new URL(req.url || '/', 'http://localhost');
        return parsed.searchParams.get(name);
    } catch {
        return null;
    }
}

function isAuthorized(req) {
    // If CRON_SECRET is unset, allow local/manual testing.
    if (!config.cronSecret) return true;

    const keyFromQuery = getQueryParam(req, 'key');
    const keyFromHeader = req.headers['x-test-key'];
    return keyFromQuery === config.cronSecret || keyFromHeader === config.cronSecret;
}

export default async function handler(req, res) {
    if (req.method && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }

    if (!isAuthorized(req)) {
        return res.status(401).json({
            error: 'Unauthorized',
            hint: 'Use /api/test-email?key=YOUR_CRON_SECRET when CRON_SECRET is enabled.',
        });
    }

    const now = new Date();
    const timestamp = now.toISOString();

    const html = `
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family: Segoe UI, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
  <h2 style="margin: 0 0 8px;">Test Route Email</h2>
  <p style="margin: 0 0 12px; color: #4b5563;">This message confirms your Vercel test route is working.</p>
  <table style="border-collapse: collapse; width: 100%;">
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Time (UTC)</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${timestamp}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Receiver</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${config.email.to}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Route</td><td style="padding: 8px; border: 1px solid #e5e7eb;">/api/test-email</td></tr>
  </table>
</body>
</html>`;

    const text = `Test Route Email\nTime (UTC): ${timestamp}\nReceiver: ${config.email.to}\nRoute: /api/test-email`;

    const result = await sendEmail('✅ Test Route Email', html, text);

    return res.status(200).json({
        sent: result.ok,
        to: config.email.to,
        messageId: result.messageId || null,
        error: result.error || null,
        triggeredAt: timestamp,
    });
}
