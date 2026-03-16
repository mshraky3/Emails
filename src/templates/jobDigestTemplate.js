function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(dateValue) {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'Unknown date';
    return parsed.toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' });
}

export function jobDigestHtml(jobs) {
    const list = Array.isArray(jobs) ? jobs : [];

    const rows = list
        .map((job) => {
            const tags = Array.isArray(job.tags) && job.tags.length > 0 ? job.tags.join(', ') : 'N/A';
            return `
<tr>
  <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top;">
    <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(job.title)}</div>
    <div style="color: #555; margin-bottom: 6px;">${escapeHtml(job.company || 'Unknown')}</div>
    <div style="font-size: 12px; color: #777;">${escapeHtml(job.source)} | ${escapeHtml(formatDate(job.postedAt))}</div>
    <div style="font-size: 12px; color: #777; margin-top: 4px;">Tags: ${escapeHtml(tags)}</div>
    <div style="margin-top: 8px;"><a href="${escapeHtml(job.url)}" style="color: #0b57d0;">Open job posting</a></div>
  </td>
</tr>`;
        })
        .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2 style="margin: 0 0 8px;">Daily Job Digest</h2>
  <p style="margin: 0 0 16px; color: #555;">${list.length} new matching roles in the last 24 hours.</p>
  <table style="width: 100%; border-collapse: collapse;">
    ${rows}
  </table>
</body>
</html>`;
}

export function jobDigestText(jobs) {
    const list = Array.isArray(jobs) ? jobs : [];
    const lines = list.map(
        (job, index) =>
            `${index + 1}. ${job.title} - ${job.company || 'Unknown'} (${job.source})\n${job.url}`,
    );

    return `Daily Job Digest\nMatches in last 24 hours: ${list.length}\n\n${lines.join('\n\n')}`;
}
