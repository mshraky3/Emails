function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function applicationNudgeHtml(applications) {
    const list = Array.isArray(applications) ? applications : [];

    const rows = list
        .map(
            (application) => `
<tr>
  <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(application.company || 'Unknown')}</td>
  <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(application.role || 'Unknown')}</td>
  <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(application.appliedDate || 'N/A')}</td>
  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${escapeHtml(application.daysSinceApplied ?? 'N/A')}</td>
  <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${escapeHtml(application.link || '#')}">Open</a></td>
</tr>`,
        )
        .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2 style="margin: 0 0 8px;">Application Follow-Up Reminder</h2>
  <p style="margin: 0 0 16px; color: #555;">You have ${list.length} application(s) that are due for follow-up.</p>

  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #f8f9fa;">
      <th style="text-align: left; padding: 8px;">Company</th>
      <th style="text-align: left; padding: 8px;">Role</th>
      <th style="text-align: left; padding: 8px;">Applied</th>
      <th style="text-align: right; padding: 8px;">Days</th>
      <th style="text-align: left; padding: 8px;">Link</th>
    </tr>
    ${rows}
  </table>
</body>
</html>`;
}

export function applicationNudgeText(applications) {
    const list = Array.isArray(applications) ? applications : [];
    const lines = list.map(
        (application, index) =>
            `${index + 1}. ${application.company || 'Unknown'} - ${application.role || 'Unknown'} | Applied ${application.appliedDate || 'N/A'} (${application.daysSinceApplied} days)\n${application.link || ''}`,
    );

    return `Application Follow-Up Reminder\nDue applications: ${list.length}\n\n${lines.join('\n\n')}`;
}
