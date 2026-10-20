'use server';

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

async function getEmailRecipients() {
  const admin = createAdminClient();
  const recipients = new Map<string, { email: string; name: string }>();

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
          email,
          name: recipientName(user),
        });
      }
    }

    if (data.users.length < 1000) break;
  }

  return [...recipients.values()];
}

export async function sendEmailToAllUsers(
  _previousState: BulkEmailState = initialResult,
  formData: FormData,
): Promise<BulkEmailState> {
  try {
    await requireAdmin();

    const subject = textField(formData, 'subject');
    const message = textField(formData, 'message');
    const confirmed = formData.get('confirmed') === 'on';

    if (!subject || subject.length > 150 || /[\r\n]/.test(subject)) {
      throw new Error('Enter a subject between 1 and 150 characters.');
    }
    if (!message || message.length > 10_000) {
      throw new Error('Enter a message between 1 and 10,000 characters.');
    }
    if (!confirmed) {
      throw new Error('Confirm that this email should be sent to every user.');
    }

    const recipients = await getEmailRecipients();
    if (!recipients.length)
      throw new Error('No user email addresses were found.');

    const result = await sendBulkEmail({ recipients, subject, message });
    const status = result.sent > 0 ? 'success' : 'error';
    const summary = `${result.sent.toLocaleString()} email${result.sent === 1 ? '' : 's'} sent${result.failed ? `; ${result.failed.toLocaleString()} failed` : ''}.`;

    return { status, message: summary, ...result };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'The bulk email could not be sent.',
      sent: 0,
      failed: 0,
    };
  }
}
