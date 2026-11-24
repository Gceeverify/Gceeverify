'use server';

import { createHash } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';
import { sendBulkEmail } from '@/lib/bulk-email';
import { createAdminClient } from '@/lib/supabase/admin';

export type BulkEmailState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  sent: number;
  failed: number;
};

const initialResult: BulkEmailState = {
  status: 'idle',
  message: '',
  sent: 0,
  failed: 0,
};

const DAILY_CAMPAIGN_LIMIT = 450;
const CAMPAIGN_HISTORY_LIMIT = 20;
const CAMPAIGN_TIME_ZONE = 'Africa/Lagos';

type CampaignRecipient = {
  id: string;
  email: string;
  name: string;
  campaignHistory: string[];
};

function textField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function recipientName(user: User) {
  const metadata = user.user_metadata as { full_name?: unknown } | null;
  if (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) {
    return metadata.full_name.trim();
  }
  return user.email?.split('@')[0] || 'Gceeverify user';
}

function emailContent(formData: FormData) {
  const subject = textField(formData, 'subject');
  const message = textField(formData, 'message');

  if (!subject || subject.length > 150 || /[\r\n]/.test(subject)) {
    throw new Error('Enter a subject between 1 and 150 characters.');
  }
  if (!message || message.length > 10_000) {
    throw new Error('Enter a message between 1 and 10,000 characters.');
  }

  return { subject, message };
}

function errorResult(error: unknown, fallback: string): BulkEmailState {
  return {
    status: 'error',
    message: error instanceof Error ? error.message : fallback,
    sent: 0,
    failed: 0,
  };
}

function campaignHistory(user: User) {
  const value = (user.app_metadata as { bulk_email_campaigns?: unknown } | null)
    ?.bulk_email_campaigns;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function campaignId(subject: string, message: string) {
  return createHash('sha256')
    .update(`${subject}\n${message}`, 'utf8')
    .digest('hex');
}

function campaignDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPAIGN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function reserveDailyBroadcast(user: User) {
  const metadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const today = campaignDate();

  if (metadata.bulk_email_last_broadcast_date === today) {
    throw new Error(
      "Today's broadcast batch has already been used. Continue this campaign tomorrow; private test emails are still available.",
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...metadata,
      bulk_email_last_broadcast_date: today,
    },
  });
  if (error) {
    throw new Error(
      `The daily broadcast allowance could not be reserved: ${error.message}`,
    );
  }
}

async function getEmailRecipients() {
  const admin = createAdminClient();
  const recipients = new Map<string, CampaignRecipient>();

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    for (const user of data.users) {
      const email = user.email?.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        recipients.set(email.toLowerCase(), {
          id: user.id,
          email,
          name: recipientName(user),
          campaignHistory: campaignHistory(user),
        });
      }
    }

    if (data.users.length < 1000) break;
  }

  return [...recipients.values()];
}

async function recordCampaignDeliveries(
  recipients: CampaignRecipient[],
  deliveredEmails: string[],
  marker: string,
) {
  const admin = createAdminClient();
  const recipientsByEmail = new Map(
    recipients.map((recipient) => [recipient.email.toLowerCase(), recipient]),
  );
  const delivered = deliveredEmails
    .map((email) => recipientsByEmail.get(email.toLowerCase()))
    .filter((recipient): recipient is CampaignRecipient => Boolean(recipient));
  let failedUpdates = 0;

  for (let index = 0; index < delivered.length; index += 20) {
    const results = await Promise.allSettled(
      delivered.slice(index, index + 20).map((recipient) => {
        const history = [...recipient.campaignHistory, marker]
          .filter(
            (value, itemIndex, values) => values.indexOf(value) === itemIndex,
          )
          .slice(-CAMPAIGN_HISTORY_LIMIT);
        return admin.auth.admin.updateUserById(recipient.id, {
          app_metadata: { bulk_email_campaigns: history },
        });
      }),
    );

    failedUpdates += results.filter(
      (result) =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && Boolean(result.value.error)),
    ).length;
  }

  return failedUpdates;
}

export async function sendEmailToAllUsers(
  _previousState: BulkEmailState = initialResult,
  formData: FormData,
): Promise<BulkEmailState> {
  try {
    const adminUser = await requireAdmin();

    const { subject, message } = emailContent(formData);
    const confirmed = formData.get('confirmed') === 'on';

    if (!confirmed) {
      throw new Error('Confirm that this email should be sent to every user.');
    }

    const recipients = await getEmailRecipients();
    if (!recipients.length)
      throw new Error('No user email addresses were found.');

    const marker = campaignId(subject, message);
    const pendingRecipients = recipients.filter(
      (recipient) => !recipient.campaignHistory.includes(marker),
    );

    if (!pendingRecipients.length) {
      return {
        status: 'success',
        message: `Campaign complete. All ${recipients.length.toLocaleString()} users have already received this exact email.`,
        sent: 0,
        failed: 0,
      };
    }

    await reserveDailyBroadcast(adminUser);
    const batch = pendingRecipients.slice(0, DAILY_CAMPAIGN_LIMIT);
    const result = await sendBulkEmail({
      recipients: batch.map(({ email, name }) => ({ email, name })),
      subject,
      message,
    });
    const trackingFailures = await recordCampaignDeliveries(
      batch,
      result.deliveredEmails,
      marker,
    );
    const remaining = Math.max(pendingRecipients.length - result.sent, 0);
    const status = result.sent > 0 && result.failed === 0 ? 'success' : 'error';
    const summary = `${result.sent.toLocaleString()} email${result.sent === 1 ? '' : 's'} sent in this batch${result.failed ? `; ${result.failed.toLocaleString()} failed` : ''}. ${remaining.toLocaleString()} recipient${remaining === 1 ? '' : 's'} remaining for the next batch.${trackingFailures ? ` Warning: delivery tracking could not be saved for ${trackingFailures.toLocaleString()} recipient${trackingFailures === 1 ? '' : 's'}; do not retry until this is reviewed.` : ''}${result.failureMessage ? ` ${result.failureMessage}` : ''}`;

    return {
      status: trackingFailures ? 'error' : status,
      message: summary,
      sent: result.sent,
      failed: result.failed,
    };
  } catch (error) {
    return errorResult(error, 'The bulk email could not be sent.');
  }
}

export async function sendTestEmailToAdmin(
  _previousState: BulkEmailState = initialResult,
  formData: FormData,
): Promise<BulkEmailState> {
  try {
    const user = await requireAdmin();
    const email = user.email?.trim();
    if (!email)
      throw new Error('Your admin account does not have an email address.');

    const { subject, message } = emailContent(formData);
    const result = await sendBulkEmail({
      recipients: [{ email, name: recipientName(user) }],
      subject: `[Test] ${subject}`,
      message,
    });

    if (result.sent !== 1 || result.failed) {
      throw new Error(
        result.failureMessage || 'The test email could not be delivered.',
      );
    }

    return {
      status: 'success',
      message: `Test email sent privately to ${email}.`,
      sent: 1,
      failed: 0,
    };
  } catch (error) {
    return errorResult(error, 'The test email could not be sent.');
  }
}
