import 'server-only';
import { list, put } from '@vercel/blob';

const TUTORIALS_PATH = 'data/tutorials.json';

export type Tutorial = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

function sortTutorials(tutorials: Tutorial[]) {
  return [...tutorials].sort(
    (left, right) =>
      left.sort_order - right.sort_order ||
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export async function getTutorials() {
  const { blobs } = await list({ prefix: TUTORIALS_PATH, limit: 1 });
  const blob = blobs.find((item) => item.pathname === TUTORIALS_PATH);
  if (!blob) return [];

  const response = await fetch(`${blob.url}?version=${blob.uploadedAt.getTime()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('The tutorial library could not be loaded.');
  const value = (await response.json()) as unknown;
  return Array.isArray(value) ? sortTutorials(value as Tutorial[]) : [];
}

export async function saveTutorials(tutorials: Tutorial[]) {
  await put(TUTORIALS_PATH, JSON.stringify(sortTutorials(tutorials)), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}
