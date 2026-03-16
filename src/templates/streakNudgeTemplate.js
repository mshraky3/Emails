export function streakNudgeHtml(username) {
    const profileUrl = `https://github.com/${username}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2 style="margin: 0 0 8px;">GitHub Streak Nudge</h2>
  <p style="margin: 0 0 16px; color: #555;">No commit has been detected yet today. A small commit now keeps your streak alive.</p>

  <a href="${profileUrl}" style="display: inline-block; background: #24292f; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
    Open GitHub Profile
  </a>

  <p style="margin-top: 20px; color: #666;">Suggested quick wins:</p>
  <ul style="color: #444;">
    <li>Update a README section</li>
    <li>Refactor one utility function</li>
    <li>Add one unit test</li>
  </ul>
</body>
</html>`;
}

export function streakNudgeText(username) {
    return `GitHub Streak Nudge\nNo commit has been detected yet today.\nProfile: https://github.com/${username}\n\nSuggested quick wins: Update README, refactor one function, or add one test.`;
}
