import 'server-only';

import nodemailer from 'nodemailer';

export type BulkEmailRecipient = {
  email: string;
  name: string;
};

type EmailContent = {
  recipients: BulkEmailRecipient[];
  subject: string;
  message: string;
};

const GMAIL_SEND_BATCH_SIZE = 5;

function emailConfiguration() {
  const gmailClientId = process.env.GMAIL_CLIENT_ID?.trim();
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s+/g, '');
  const fromAddress = process.env.EMAIL_FROM_ADDRESS?.trim() || user;
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || 'Gceeverify Support';
  const gmailApiValues = [gmailClientId, gmailClientSecret, gmailRefreshToken];

  if (gmailApiValues.some(Boolean)) {
    if (!gmailApiValues.every(Boolean)) {
      throw new Error(
        'Gmail API setup is incomplete. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN.',
      );
    }
    if (!fromAddress) {
      throw new Error(
        'Gmail API setup is missing EMAIL_FROM_ADDRESS or SMTP_USER.',
      );
    }

    return {
      provider: 'gmail-api' as const,
      clientId: gmailClientId!,
      clientSecret: gmailClientSecret!,
      refreshToken: gmailRefreshToken!,
      fromAddress,
      fromName,
    };
  }

  if (user && password) {
    return {
      provider: 'smtp' as const,
      user,
      password,
      fromName,
    };
  }

  throw new Error(
    'Bulk email is not configured. Add Gmail API credentials, or configure SMTP credentials on a host that permits SMTP.',
  );
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

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unknown email provider error.';
}

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      error?: { message?: unknown } | string;
      error_description?: unknown;
    };
    if (typeof body.error_description === 'string')
      return body.error_description;
    if (typeof body.error === 'string') return body.error;
    if (typeof body.error?.message === 'string') return body.error.message;
  } catch {
    // Use the status-based fallback when the provider did not return JSON.
  }
  return fallback;
}

async function gmailAccessToken(
  config: Extract<
    ReturnType<typeof emailConfiguration>,
    { provider: 'gmail-api' }
  >,
) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      await responseError(
        response,
        `Google OAuth rejected the token request (${response.status}).`,
      ),
    );
  }

  const body = (await response.json()) as { access_token?: unknown };
  if (typeof body.access_token !== 'string' || !body.access_token) {
    throw new Error('Google OAuth did not return an access token.');
  }
  return body.access_token;
}

async function gmailRawMessage({
  recipient,
  content,
  config,
}: {
  recipient: BulkEmailRecipient;
  content: EmailContent;
  config: Extract<
    ReturnType<typeof emailConfiguration>,
    { provider: 'gmail-api' }
  >;
}) {
  const composer = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });
  const result = await composer.sendMail({
    from: { name: config.fromName, address: config.fromAddress },
    replyTo: config.fromAddress,
    to: { name: recipient.name, address: recipient.email },
    subject: content.subject,
    text: content.message,
    html: messageHtml(content.message),
  });

  if (!Buffer.isBuffer(result.message)) {
    throw new Error('The email message could not be encoded for Gmail.');
  }
  return result.message.toString('base64url');
}

async function sendWithGmailApi(
  content: EmailContent,
  config: Extract<
    ReturnType<typeof emailConfiguration>,
    { provider: 'gmail-api' }
  >,
) {
  const accessToken = await gmailAccessToken(config);
  let sent = 0;
  let failed = 0;
  let failureMessage = '';

  for (
    let index = 0;
    index < content.recipients.length;
    index += GMAIL_SEND_BATCH_SIZE
  ) {
    const batch = content.recipients.slice(
      index,
      index + GMAIL_SEND_BATCH_SIZE,
    );
    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const raw = await gmailRawMessage({ recipient, content, config });
        const response = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw }),
            signal: AbortSignal.timeout(20_000),
          },
        );

        if (!response.ok) {
          throw new Error(
            await responseError(
              response,
              `Gmail rejected the email (${response.status}).`,
            ),
          );
        }
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') sent += 1;
      else {
        failed += 1;
        failureMessage ||= `Gmail API could not send an email: ${errorMessage(result.reason)}`;
      }
    }
  }

  if (!sent && failureMessage) throw new Error(failureMessage);
  return { sent, failed, failureMessage };
}

function smtpError(error: unknown) {
  const details = error as {
    code?: unknown;
    originalCode?: unknown;
  };
  const timedOut =
    details.code === 'ETIMEDOUT' ||
    details.originalCode === 'ETIMEDOUT' ||
    details.originalCode === 'ETIMEOUT';

  if (timedOut) {
    return new Error(
      'Gmail SMTP could not be reached. On Railway Free, Trial, or Hobby, configure the Gmail API credentials to send over HTTPS; on Railway Pro, redeploy before retrying SMTP.',
    );
  }

  return error instanceof Error
    ? error
    : new Error('The SMTP email provider could not be reached.');
}

async function sendWithSmtp(
  content: EmailContent,
  config: Extract<ReturnType<typeof emailConfiguration>, { provider: 'smtp' }>,
) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    auth: { user: config.user, pass: config.password },
  });
  const html = messageHtml(content.message);
  let sent = 0;
  let failed = 0;

  try {
    await transporter.verify();

    for (let index = 0; index < content.recipients.length; index += 5) {
      const batch = content.recipients.slice(index, index + 5);
      const results = await Promise.allSettled(
        batch.map((recipient) =>
          transporter.sendMail({
            from: { name: config.fromName, address: config.user },
            replyTo: config.user,
            to: { name: recipient.name, address: recipient.email },
            subject: content.subject,
            text: content.message,
            html,
          }),
        ),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') sent += 1;
        else failed += 1;
      }
    }
  } catch (error) {
    throw smtpError(error);
  } finally {
    transporter.close();
  }

  return { sent, failed, failureMessage: '' };
}

export async function sendBulkEmail(content: EmailContent) {
  const config = emailConfiguration();
  return config.provider === 'gmail-api'
    ? sendWithGmailApi(content, config)
    : sendWithSmtp(content, config);
}
