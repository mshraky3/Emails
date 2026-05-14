import 'dotenv/config';

const parseIntOr = (value, fallback) => {
    const parsed = parseInt(value ?? '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseFloatOr = (value, fallback) => {
    const parsed = parseFloat(value ?? '');
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseCsvOr = (value, fallback) => {
    if (!value || !String(value).trim()) return fallback;
    const parts = String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return parts.length > 0 ? parts : fallback;
};

// Default values are sourced from EMAIL_SENDER_SETUP.txt provided by the user.
const defaultEmail = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    fromName: 'for-you',
    user: 'alshrakynodeapp@gmail.com',
    to: 'alshraky3@gmail.com',
};

const config = {
    email: {
        host: process.env.EMAIL_HOST || defaultEmail.host,
        port: parseIntOr(process.env.EMAIL_PORT, defaultEmail.port),
        secure: (process.env.EMAIL_SECURE || String(defaultEmail.secure)) === 'true',
        fromName: process.env.EMAIL_FROM_NAME || defaultEmail.fromName,
        user: process.env.EMAIL_USER || defaultEmail.user,
        pass: process.env.EMAIL_PASS || '',
        to: process.env.EMAIL_TO || defaultEmail.to,
    },
    timezone: process.env.TIMEZONE || 'Asia/Riyadh',
    birthDate: process.env.BIRTH_DATE || '2003-11-25',
    reminderWindowStart: parseIntOr(process.env.REMINDER_WINDOW_START, 8),
    reminderWindowEnd: parseIntOr(process.env.REMINDER_WINDOW_END, 22),
    github: {
        username: process.env.GITHUB_USERNAME || 'mshraky3',
        token: process.env.GITHUB_TOKEN || '',
    },
    jobs: {
        keywords: parseCsvOr(
            process.env.JOB_KEYWORDS,
            ['React', 'Node.js', 'TypeScript', 'Next.js', 'Python', 'Frontend', 'Backend', 'Full Stack', 'automation'],
        ),
    },
    application: {
        followUpDays: parseIntOr(process.env.APPLICATION_FOLLOW_UP_DAYS, 7),
    },
    gold: {
        changePercentThreshold: parseFloatOr(process.env.GOLD_CHANGE_PERCENT_THRESHOLD, 2),
        changeAbsoluteThreshold: parseFloatOr(process.env.GOLD_CHANGE_ABSOLUTE_THRESHOLD, 5),
    },
    cronSecret: process.env.CRON_SECRET || '',
};

if (!config.email.pass) {
    console.warn('[config] EMAIL_PASS is empty. Set it in .env to enable email sending.');
}

export default config;
