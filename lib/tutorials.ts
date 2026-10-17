import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function getTutorials() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tutorials')
    .select(
      'id,title,description,video_url,thumbnail_url,is_published,sort_order,created_at',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error('The tutorial library could not be loaded.');
  return (data ?? []) as Tutorial[];
}

export async function createTutorial(tutorial: Tutorial) {
  const admin = createAdminClient();
  const { error } = await admin.from('tutorials').insert(tutorial);
  if (error) throw new Error('The tutorial could not be created.');
}

export async function setTutorialPublished(id: string, isPublished: boolean) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tutorials')
    .update({ is_published: isPublished })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('That tutorial no longer exists.');
}

export async function deleteTutorial(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tutorials')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('That tutorial no longer exists.');
}
