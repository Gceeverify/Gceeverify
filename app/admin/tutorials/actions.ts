'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { getTutorials, saveTutorials } from '@/lib/tutorials';

function field(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

function adminUrl(type: 'notice' | 'error', message: string) {
  return `/admin/tutorials?${type}=${encodeURIComponent(message)}`;
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function createTutorial(formData: FormData) {
  let destination = adminUrl('error', 'The tutorial could not be created.');
  try {
    await requireAdmin();
    const title = field(formData, 'title');
    const description = field(formData, 'description');
    const videoUrl = field(formData, 'videoUrl');
    const thumbnailUrl = field(formData, 'thumbnailUrl');
    const sortOrder = Number(field(formData, 'sortOrder') || 0);

    if (title.length < 3 || title.length > 120) {
      throw new Error('Use a tutorial title between 3 and 120 characters.');
    }
    if (!validUrl(videoUrl)) {
      throw new Error('Enter a valid video URL.');
    }
    if (thumbnailUrl && !validUrl(thumbnailUrl)) {
      throw new Error('Enter a valid thumbnail URL or leave it empty.');
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      throw new Error('Sort order must be a whole number from 0 to 9999.');
    }

    const tutorials = await getTutorials();
    tutorials.push({
      id: crypto.randomUUID(),
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl || null,
      is_published: formData.get('isPublished') === 'on',
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    });
    await saveTutorials(tutorials);

    revalidatePath('/tutorials');
    revalidatePath('/admin/tutorials');
    destination = adminUrl('notice', 'Tutorial created.');
  } catch (error) {
    destination = adminUrl(
      'error',
      error instanceof Error ? error.message : 'The tutorial could not be created.',
    );
  }
  redirect(destination);
}

export async function manageTutorial(formData: FormData) {
  let destination = adminUrl('error', 'The tutorial could not be updated.');
  try {
    await requireAdmin();
    const id = field(formData, 'id');
    const intent = field(formData, 'intent');
    if (!id || !['publish', 'unpublish', 'delete'].includes(intent)) {
      throw new Error('That tutorial action is invalid.');
    }

    const tutorials = await getTutorials();
    const tutorial = tutorials.find((item) => item.id === id);
    if (!tutorial) throw new Error('That tutorial no longer exists.');
    const nextTutorials =
      intent === 'delete'
        ? tutorials.filter((item) => item.id !== id)
        : tutorials.map((item) =>
            item.id === id
              ? { ...item, is_published: intent === 'publish' }
              : item,
          );
    await saveTutorials(nextTutorials);

    revalidatePath('/tutorials');
    revalidatePath('/admin/tutorials');
    destination = adminUrl(
      'notice',
      intent === 'delete'
        ? 'Tutorial deleted.'
        : intent === 'publish'
          ? 'Tutorial published.'
          : 'Tutorial hidden.',
    );
  } catch (error) {
    destination = adminUrl(
      'error',
      error instanceof Error ? error.message : 'The tutorial could not be updated.',
    );
  }
  redirect(destination);
}
