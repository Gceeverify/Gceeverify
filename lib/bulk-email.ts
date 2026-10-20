import 'server-only';

import nodemailer from 'nodemailer';

export type BulkEmailRecipient = {
  email: string;
  name: string;
};

function emailConfiguration() {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s+/g, '');

  if (!user || !password) {
    throw new Error(
      'Bulk email is not configured. Add SMTP_USER and SMTP_APP_PASSWORD to the server environment.',
    );
  }

  return {
    user,
    password,
    fromName: process.env.EMAIL_FROM_NAME?.trim() || 'Gceeverify Support',
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function messageHtml(message: string) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;line-height:1.7">${paragraph.replaceAll('\n', '<br>')}</p>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f8f3;color:#132718;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">A message from Gceeverify Support</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8f3;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dce8da;border-radius:18px;overflow:hidden">
          <tr><td style="padding:22px 28px;background:#0f2115;color:#f5fff3;font-size:20px;font-weight:700">Gceeverify</td></tr>
          <tr><td style="padding:30px 28px;font-size:15px">${paragraphs}</td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #e4ece2;color:#687a6c;font-size:12px;line-height:1.6">This message was sent by Gceeverify Support because you have a Gceeverify account.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendBulkEmail({
  recipients,
  subject,
  message,
}: {
  recipients: BulkEmailRecipient[];
  subject: string;
  message: string;
}) {
  const config = emailConfiguration();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: { user: config.user, pass: config.password },
  });
  const html = messageHtml(message);
  let sent = 0;
  let failed = 0;

  try {
    await transporter.verify();

    for (let index = 0; index < recipients.length; index += 5) {
      const batch = recipients.slice(index, index + 5);
      const results = await Promise.allSettled(
        batch.map((recipient) =>
          transporter.sendMail({
            from: { name: config.fromName, address: config.user },
            replyTo: config.user,
            to: { name: recipient.name, address: recipient.email },
            subject,
            text: message,
            html,
          }),
        ),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') sent += 1;
        else failed += 1;
      }
    }
  } finally {
    transporter.close();
  }

  return { sent, failed };
}
