import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
const EMAIL_LOGO_CID = 'gceeverify-logo';
let emailLogoContentPromise: Promise<Buffer> | undefined;

function emailLogoContent() {
  emailLogoContentPromise ??= readFile(
    join(process.cwd(), 'public', 'logo-transparent.png'),
  );
  return emailLogoContentPromise;
}

function emailLogoAttachment(content: Buffer) {
  return {
    filename: 'gceeverify-logo.png',
    content,
    cid: EMAIL_LOGO_CID,
    contentDisposition: 'inline' as const,
  };
}

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

function personalizedMessage(recipient: BulkEmailRecipient, message: string) {
  const name = recipient.name.replace(/\s+/g, ' ').trim();
  const greeting =
    name && name !== 'Gceeverify user' ? `Hi ${name},` : 'Hi there,';
  return `${greeting}\n\n${message}`;
}

function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    return ['http:', 'https:'].includes(url.protocol)
      ? url.toString().replace(/\/$/, '')
      : null;
  } catch {
    return null;
  }
}

function messageHtml(
  recipient: BulkEmailRecipient,
  subject: string,
  message: string,
) {
  const paragraphs = escapeHtml(personalizedMessage(recipient, message))
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;line-height:1.7">${paragraph.replaceAll('\n', '<br>')}</p>`,
    )
    .join('');
  const siteUrl = publicSiteUrl();
  const brand = `<img src="cid:${EMAIL_LOGO_CID}" width="48" height="48" alt="Gceeverify" style="display:block;width:48px;height:48px;border:0;object-fit:contain">`;
  const dashboardButton = siteUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px"><tr><td style="border-radius:999px;background:#61ee65"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:13px 22px;color:#102314;font-size:13px;font-weight:800;text-decoration:none">Open Gceeverify</a></td></tr></table>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;padding:0;background:#eef4ed;color:#132718;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(subject)} — a message from Gceeverify Support</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#eef4ed;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #d8e6d6;border-radius:22px;overflow:hidden;box-shadow:0 16px 50px rgba(21,53,28,.10)">
          <tr><td style="padding:26px 30px;background:#0b2112">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td width="62" valign="middle">${brand}</td>
              <td valign="middle"><strong style="display:block;color:#f6fff4;font-size:21px;letter-spacing:-.4px">Gceeverify</strong><span style="display:block;margin-top:4px;color:#9ec6a3;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Digital services, simplified</span></td>
              <td align="right" valign="middle"><span style="display:inline-block;padding:7px 10px;border:1px solid rgba(97,238,101,.28);border-radius:999px;color:#8ef592;font-size:10px;font-weight:700">ACCOUNT UPDATE</span></td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:34px 30px 30px">
            <p style="margin:0 0 9px;color:#4b6751;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">A message from our team</p>
            <h1 style="margin:0 0 24px;color:#102b18;font-size:25px;line-height:1.25;letter-spacing:-.5px">${escapeHtml(subject)}</h1>
            <div style="color:#294630;font-size:15px;line-height:1.7">${paragraphs}</div>
            ${dashboardButton}
          </td></tr>
          <tr><td style="padding:20px 30px;border-top:1px solid #e3ece1;background:#f8fbf7;color:#6a7f6e;font-size:11px;line-height:1.7">
            This email was sent by Gceeverify Support because this address is registered to a Gceeverify account. For your security, we will never ask for your password or verification code by email.
          </td></tr>
        </table>
        <p style="margin:18px 0 0;color:#819086;font-size:10px">© ${new Date().getFullYear()} Gceeverify. All rights reserved.</p>
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
    text: personalizedMessage(recipient, content.message),
    html: messageHtml(recipient, content.subject, content.message),
    attachments: [emailLogoAttachment(await emailLogoContent())],
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
  const deliveredEmails: string[] = [];

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

    for (const [resultIndex, result] of results.entries()) {
      if (result.status === 'fulfilled') sent += 1;
      if (result.status === 'fulfilled') {
        deliveredEmails.push(batch[resultIndex].email);
      } else {
        failed += 1;
        failureMessage ||= `Gmail API could not send an email: ${errorMessage(result.reason)}`;
      }
    }
  }

  if (!sent && failureMessage) throw new Error(failureMessage);
  return { sent, failed, failureMessage, deliveredEmails };
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
  let sent = 0;
  let failed = 0;
  const deliveredEmails: string[] = [];

  try {
    await transporter.verify();
    const logoContent = await emailLogoContent();

    for (let index = 0; index < content.recipients.length; index += 5) {
      const batch = content.recipients.slice(index, index + 5);
      const results = await Promise.allSettled(
        batch.map((recipient) =>
          transporter.sendMail({
            from: { name: config.fromName, address: config.user },
            replyTo: config.user,
            to: { name: recipient.name, address: recipient.email },
            subject: content.subject,
            text: personalizedMessage(recipient, content.message),
            html: messageHtml(recipient, content.subject, content.message),
            attachments: [emailLogoAttachment(logoContent)],
          }),
        ),
      );

      for (const [resultIndex, result] of results.entries()) {
        if (result.status === 'fulfilled') sent += 1;
        if (result.status === 'fulfilled') {
          deliveredEmails.push(batch[resultIndex].email);
        } else failed += 1;
      }
    }
  } catch (error) {
    throw smtpError(error);
  } finally {
    transporter.close();
  }

  return { sent, failed, failureMessage: '', deliveredEmails };
}

export async function sendBulkEmail(content: EmailContent) {
  const config = emailConfiguration();
  return config.provider === 'gmail-api'
    ? sendWithGmailApi(content, config)
    : sendWithSmtp(content, config);
}
