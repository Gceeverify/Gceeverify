'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

const validActions = new Set(['promote', 'demote', 'ban', 'unban', 'delete']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

function adminUrl(type: 'notice' | 'error', message: string) {
  return `/admin?${type}=${encodeURIComponent(message)}`;
}

export async function manageUser(formData: FormData) {
  let destination = adminUrl('error', 'The requested action could not be completed.');

  try {
    const actor = await requireAdmin();
    const targetId = field(formData, 'userId');
    const intent = field(formData, 'intent');

    if (!uuidPattern.test(targetId) || !validActions.has(intent)) {
      throw new Error('That admin request is invalid.');
    }

    if (targetId === actor.id && ['demote', 'ban', 'delete'].includes(intent)) {
      throw new Error('You cannot remove access from your own admin account.');
    }

    const admin = createAdminClient();
    const { data, error: targetError } = await admin.auth.admin.getUserById(targetId);
    if (targetError || !data.user) throw new Error('That user could not be found.');

    const target = data.user;
    const currentMetadata = target.app_metadata ?? {};
    let error: Error | null = null;
    let success = 'User updated.';

    if (intent === 'promote' || intent === 'demote') {
      const role = intent === 'promote' ? 'admin' : 'user';
      const result = await admin.auth.admin.updateUserById(targetId, {
        app_metadata: { ...currentMetadata, role },
      });
      error = result.error;
      success = intent === 'promote' ? 'User appointed as an admin.' : 'Admin access removed.';
    } else if (intent === 'ban' || intent === 'unban') {
      const banned = intent === 'ban';
      const result = await admin.auth.admin.updateUserById(targetId, {
        ban_duration: banned ? '876000h' : 'none',
        app_metadata: { ...currentMetadata, banned },
      });
      error = result.error;
      success = banned ? 'User has been banned.' : 'User has been unbanned.';
    } else {
      const result = await admin.auth.admin.deleteUser(targetId, false);
      error = result.error;
      success = 'User account permanently deleted.';
    }

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    destination = adminUrl('notice', success);
  } catch (error) {
    destination = adminUrl(
      'error',
      error instanceof Error ? error.message : 'The requested action could not be completed.',
    );
  }

  redirect(destination);
}
