/**
 * Local dev helper — run manually to test individual components.
 *
 * Usage:
 *   node src/dev.js age        — preview age reminder email
 *   node src/dev.js gold       — fetch gold prices and preview advisory
 *   node src/dev.js recommend  — run recommendation engine on synthetic data
 *   node src/dev.js send       — ACTUALLY send both test emails via Gmail
 *   node src/dev.js send-all   — Send ALL 5 test emails (age, gold, streak, jobs, apps)
 */
import 'dotenv/config';
import { ageReminderHtml, ageReminderText } from './templates/ageReminderTemplate.js';
import {
    fetchBullionPrices,
    bullionPrices,
    fetchGoldHistorySeries,
} from './services/gold/normalizeBullionPrices.js';
import { evaluateGold } from './services/recommendation/goldRecommendationEngine.js';
import { fetchTodayActivity } from './services/github/fetchGitHubActivity.js';
import { fetchRemotiveJobs } from './services/jobs/fetchRemotiveJobs.js';
import { fetchWuzzufJobs } from './services/jobs/fetchWuzzufJobs.js';
import { readApplications, getDueFollowUps } from './services/applications/readApplications.js';
import { goldAdvisoryHtml, goldAdvisoryText } from './templates/goldAdvisoryTemplate.js';
import { streakNudgeHtml, streakNudgeText } from './templates/streakNudgeTemplate.js';
import { jobDigestHtml, jobDigestText } from './templates/jobDigestTemplate.js';
import { applicationNudgeHtml, applicationNudgeText } from './templates/applicationNudgeTemplate.js';
import { sendEmail } from './services/email/sendNotificationEmail.js';
import config from './config/env.js';

const cmd = process.argv[2] || 'age';

if (cmd === 'age') {
    const birthDate = process.env.BIRTH_DATE || '2003-11-25';
    console.log(ageReminderText(birthDate));
    console.log('\n--- HTML preview saved to stdout ---');
    console.log(ageReminderHtml(birthDate));
}

if (cmd === 'gold') {
    const prices = await fetchBullionPrices();
    if (!prices) {
        console.error('Could not fetch gold prices from any source.');
        process.exit(1);
    }
    console.log('Gold prices (SAR/gram):', prices);
    console.log('Bullion:', bullionPrices(prices.karat24));
}

if (cmd === 'recommend') {
    // Synthetic 30-day history with a mild downtrend
    const history = Array.from({ length: 30 }, (_, i) => 310 - i * 0.3 + Math.sin(i) * 2);
    const result = evaluateGold(history, null);
    console.log('Recommendation:', result);
    console.log(
        goldAdvisoryText({
            prices: { karat24: history[0], source: 'synthetic' },
            recommendation: result,
        }),
    );
}

if (cmd === 'send') {
    const birthDate = config.birthDate;
    console.log(`\n[test] Sending to: ${config.email.to}`);
    console.log(`[test] Using Gmail account: ${config.email.user}\n`);

    // 1. Age reminder email
    console.log('--- Sending age reminder email ---');
    const ageHtml = ageReminderHtml(birthDate);
    const ageText = ageReminderText(birthDate);
    const ageResult = await sendEmail('[TEST] Daily Age Reminder', ageHtml, ageText);
    console.log('Age reminder result:', ageResult);

    // 2. Gold advisory email — use live prices + history
    console.log('\n--- Fetching live gold data for advisory email ---');
    let prices = await fetchBullionPrices();
    const history = await fetchGoldHistorySeries(40).catch(() => null);

    if (!prices && history && history.length > 0) {
        // Derive SAR/gram from Stooq USD/oz using a fixed SAR peg rate
        const USD_TO_SAR = 3.75;
        const TROY_OZ_TO_GRAM = 31.1035;
        const karat24 = parseFloat(((history[0] / TROY_OZ_TO_GRAM) * USD_TO_SAR).toFixed(2));
        prices = { karat24, source: 'stooq-derived' };
        console.log(`[gold] Derived price from Stooq history: ${karat24} SAR/g`);
    }

    if (!prices) {
        console.error('[test] Could not fetch gold prices from any source. Skipping gold email.');
    } else {
        console.log('Live prices (SAR/gram):', prices);
        console.log(`History loaded: ${history ? history.length : 0} days`);
        const recommendation = history ? evaluateGold(history, null) : { signal: 'WATCH', confidence: 0.5, reasons: ['Insufficient data'] };
        console.log('Recommendation:', recommendation);

        const goldHtml = goldAdvisoryHtml({ prices, bullion: bullionPrices(prices.karat24), recommendation, trigger: 'periodic' });
        const goldText = goldAdvisoryText({ prices, recommendation });
        const goldResult = await sendEmail('[TEST] Gold Price Advisory', goldHtml, goldText);
        console.log('Gold advisory result:', goldResult);
    }

    console.log('\n[test] Done. Check your inbox at', config.email.to);
}

if (cmd === 'streak') {
    try {
        const activity = await fetchTodayActivity(
            config.github.username,
            config.github.token,
            config.timezone,
        );
        console.log('GitHub activity:', activity);
    } catch (err) {
        console.error('[streak] failed:', err.message);
        process.exit(1);
    }
}

if (cmd === 'jobs') {
    const keywords = config.jobs.keywords;
    const [remoteResult, saudiResult] = await Promise.allSettled([
        fetchRemotiveJobs(keywords),
        fetchWuzzufJobs(keywords),
    ]);

    const jobs = [];
    if (remoteResult.status === 'fulfilled') jobs.push(...remoteResult.value);
    if (saudiResult.status === 'fulfilled') jobs.push(...saudiResult.value);

    console.log('Keywords:', keywords);
    console.log('Remotive status:', remoteResult.status);
    console.log('Wuzzuf status:', saudiResult.status);
    console.log('Total fetched jobs:', jobs.length);
    console.log(jobs.slice(0, 10));
}

if (cmd === 'apps') {
    const applications = await readApplications();
    const due = getDueFollowUps(applications, config.application.followUpDays);
    console.log('Applications loaded:', applications.length);
    console.log('Follow-up threshold (days):', config.application.followUpDays);
    console.log('Due follow-ups:', due.length);
    console.log(due);
}

if (cmd === 'send-all') {
    const sep = (label) => console.log(`\n${'─'.repeat(50)}\n  ${label}\n${'─'.repeat(50)}`);
    console.log(`\n[send-all] Sending ALL test emails to: ${config.email.to}`);

    // ── 1. Age reminder ────────────────────────────────
    sep('1/5  Age Reminder');
    const ageHtml = ageReminderHtml(config.birthDate);
    const ageText = ageReminderText(config.birthDate);
    const ageR = await sendEmail('[TEST] Daily Age Reminder', ageHtml, ageText);
    console.log('Result:', ageR);

    // ── 2. Gold advisory ───────────────────────────────
    sep('2/5  Gold Advisory');
    let prices = await fetchBullionPrices();
    const history = await fetchGoldHistorySeries(40).catch(() => null);
    if (!prices && history?.length > 0) {
        const karat24 = parseFloat(((history[0] / 31.1035) * 3.75).toFixed(2));
        prices = { karat24, source: 'stooq-derived' };
        console.log(`Derived price: ${karat24} SAR/g`);
    }
    if (!prices) {
        console.warn('Could not fetch gold prices — skipping gold email.');
    } else {
        const recommendation = history ? evaluateGold(history, null) : { signal: 'WATCH', confidence: 50, reasons: ['Insufficient data'] };
        const goldHtml = goldAdvisoryHtml({ prices, bullion: bullionPrices(prices.karat24), recommendation, trigger: 'periodic' });
        const goldR = await sendEmail('[TEST] Gold Price Advisory', goldHtml, goldAdvisoryText({ prices, recommendation }));
        console.log('Result:', goldR);
    }

    // ── 3. GitHub streak nudge ─────────────────────────
    sep('3/5  GitHub Streak Nudge');
    try {
        const activity = await fetchTodayActivity(config.github.username, config.github.token, config.timezone);
        console.log('Activity:', activity);
        // Always send nudge in test mode regardless of commit status
        const streakR = await sendEmail(
            '[TEST] GitHub Streak Nudge',
            streakNudgeHtml(activity.username),
            streakNudgeText(activity.username),
        );
        console.log('Result:', streakR);
    } catch (err) {
        console.warn('GitHub API failed:', err.message);
    }

    // ── 4. Job digest ──────────────────────────────────
    sep('4/5  Job Digest');
    const keywords = config.jobs.keywords;
    const [remoteR, wuzzufR] = await Promise.allSettled([
        fetchRemotiveJobs(keywords),
        fetchWuzzufJobs(keywords),
    ]);
    const allJobs = [
        ...(remoteR.status === 'fulfilled' ? remoteR.value : []),
        ...(wuzzufR.status === 'fulfilled' ? wuzzufR.value : []),
    ];
    console.log(`Remotive: ${remoteR.status} | Wuzzuf: ${wuzzufR.status} | Matches: ${allJobs.length}`);
    if (allJobs.length === 0) {
        // Send even with 0 matches in test mode so you can see the email format
        console.log('No live matches today — sending empty digest to preview template.');
    }
    const jobR = await sendEmail(
        `[TEST] Job Digest (${allJobs.length} matches)`,
        jobDigestHtml(allJobs),
        jobDigestText(allJobs),
    );
    console.log('Result:', jobR);

    // ── 5. Application follow-up ───────────────────────
    sep('5/5  Application Follow-Up');
    const applications = await readApplications();
    const due = getDueFollowUps(applications, config.application.followUpDays);
    console.log(`Applications: ${applications.length} total, ${due.length} due for follow-up (threshold: ${config.application.followUpDays} days)`);
    const appsR = await sendEmail(
        `[TEST] Application Follow-Up (${due.length} due)`,
        applicationNudgeHtml(due.length > 0 ? due : applications.map((a) => ({ ...a, daysSinceApplied: 16 }))),
        applicationNudgeText(due.length > 0 ? due : applications.map((a) => ({ ...a, daysSinceApplied: 16 }))),
    );
    console.log('Result:', appsR);

    console.log(`\n[send-all] Done. Check ${config.email.to}`);
}
