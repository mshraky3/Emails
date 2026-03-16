/**
 * Calculate exact age from a birth date.
 * Returns years, months, days.
 */
export function calculateAge(birthDateStr, now = new Date()) {
  const birth = new Date(birthDateStr + 'T00:00:00');
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

/**
 * Calculate total days lived.
 */
export function daysLived(birthDateStr, now = new Date()) {
  const birth = new Date(birthDateStr + 'T00:00:00');
  return Math.floor((now - birth) / (1000 * 60 * 60 * 24));
}

/**
 * Build an HTML age reminder email.
 */
export function ageReminderHtml(birthDateStr, now = new Date()) {
  const age = calculateAge(birthDateStr, now);
  const total = daysLived(birthDateStr, now);
  const isBirthday =
    now.getMonth() === new Date(birthDateStr).getMonth() &&
    now.getDate() === new Date(birthDateStr).getDate();

  const dateStr = now.toLocaleDateString('en-SA', {
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
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2 style="color: #2c3e50; margin-bottom: 4px;">⏳ Daily Age Reminder</h2>
  <p style="color: #7f8c8d; margin-top: 0;">${dateStr}</p>

  ${isBirthday ? '<p style="font-size: 1.4em;">🎂 Happy Birthday!</p>' : ''}

  <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 16px 0;">
    <p style="font-size: 1.6em; font-weight: 700; margin: 0 0 8px;">
      ${age.years} years, ${age.months} months, ${age.days} days
    </p>
    <p style="color: #555; margin: 0;">That's <strong>${total.toLocaleString()}</strong> days on this earth.</p>
  </div>

  <p style="color: #888; font-size: 0.85em; margin-top: 24px;">
    Born: November 25, 2003 &middot; Make today count.
  </p>
</body>
</html>`;
}

/**
 * Plain-text version.
 */
export function ageReminderText(birthDateStr, now = new Date()) {
  const age = calculateAge(birthDateStr, now);
  const total = daysLived(birthDateStr, now);
  return `Age Reminder — You are ${age.years} years, ${age.months} months, ${age.days} days old. (${total} days total). Make today count.`;
}
