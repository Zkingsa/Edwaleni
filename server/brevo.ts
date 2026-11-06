function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

export async function sendStaffInvitation(
  email: string,
  name: string,
  loginIdentifier: string,
  actionLink: string
) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'God The Rock Assembly';

  if (!apiKey || !senderEmail) {
    throw new Error('Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject: 'Set up your church portal account',
      htmlContent: `<p>Hello ${escapeHtml(name)},</p>
        <p>Your church portal account is ready. Use the secure link below to verify your email and set your password.</p>
        <p><a href="${escapeHtml(actionLink)}">Verify email and set password</a></p>
        <p>After setup, sign in with this email address: <strong>${escapeHtml(email)}</strong>.</p>
        <p>You can also use your staff login ID: <strong>${escapeHtml(loginIdentifier)}</strong>.</p>
        <p>If you were not expecting this invitation, you can ignore this message.</p>`,
      textContent: `Hello ${name},\n\nYour church portal account is ready. Verify your email and set your password here:\n${actionLink}\n\nAfter setup, sign in with this email address: ${email}.\nYou can also use your staff login ID: ${loginIdentifier}.\n\nIf you were not expecting this invitation, ignore this message.`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Brevo invitation delivery failed:', response.status, detail);
    throw new Error('Could not send the invitation email. Check Brevo configuration and try again.');
  }
}
