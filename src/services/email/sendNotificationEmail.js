import nodemailer from 'nodemailer';
import config from '../../config/env.js';

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

/**
 * Send an email notification with one retry on failure.
 * @param {string} subject
 * @param {string} html
 * @param {string} [text] - plain-text fallback
 */
export async function sendEmail(subject, html, text) {
    const mailOptions = {
        from: `Reminder Service <${config.email.user}>`,
        to: config.email.to,
        subject,
        html,
        text: text || '',
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[email] sent: ${info.messageId}`);
        return { ok: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[email] first attempt failed: ${err.message}`);
        // single retry after 3s
        await new Promise((r) => setTimeout(r, 3000));
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[email] retry sent: ${info.messageId}`);
            return { ok: true, messageId: info.messageId };
        } catch (retryErr) {
            console.error(`[email] retry also failed: ${retryErr.message}`);
            return { ok: false, error: retryErr.message };
        }
    }
}
