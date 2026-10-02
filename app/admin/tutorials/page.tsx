import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { isAdminUser } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { getTutorials } from '@/lib/tutorials';
import { createTutorial, manageTutorial } from './actions';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminTutorialsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/tutorials');
  if (!isAdminUser(user)) redirect('/dashboard');

  const [tutorialResult, params] = await Promise.allSettled([
    getTutorials(),
    searchParams,
  ]);
  const tutorials = tutorialResult.status === 'fulfilled' ? tutorialResult.value : [];
  const queryError =
    tutorialResult.status === 'rejected'
      ? tutorialResult.reason instanceof Error
        ? tutorialResult.reason
        : new Error('Tutorials could not be loaded.')
      : null;
  const resolvedParams = params.status === 'fulfilled' ? params.value : {};

  return (
    <main className={styles.setupShell}>
      <section className={`${styles.setupCard} ${styles.tutorialAdminCard}`}>
        <div className={styles.tutorialAdminHead}>
          <div>
            <span>Tutorial library</span>
            <h1>Teach users how it works</h1>
          </div>
          <Link href="/admin">Back to admin</Link>
        </div>

        {(resolvedParams.notice || resolvedParams.error || queryError) && (
          <p className={resolvedParams.error || queryError ? styles.errorNotice : styles.successNotice}>
            {resolvedParams.error ?? queryError?.message ?? resolvedParams.notice}
          </p>
        )}

        <form action={createTutorial} className={styles.tutorialForm}>
          <label>
            Title
            <input name="title" required minLength={3} maxLength={120} />
          </label>
          <label>
            Video URL
            <input name="videoUrl" type="url" required placeholder="https://youtube.com/watch?v=..." />
          </label>
          <label>
            Thumbnail URL (optional)
            <input name="thumbnailUrl" type="url" placeholder="https://..." />
          </label>
          <label>
            Sort order
            <input name="sortOrder" type="number" min="0" max="9999" defaultValue="0" />
          </label>
          <label className={styles.tutorialDescription}>
            Description
            <textarea name="description" rows={4} maxLength={1000} />
          </label>
          <label className={styles.tutorialCheckbox}>
            <input name="isPublished" type="checkbox" defaultChecked />
            Publish immediately
          </label>
          <button type="submit"><Plus /> Add tutorial</button>
        </form>

        <div className={styles.tutorialAdminList}>
          {tutorials.map((tutorial) => (
            <article key={tutorial.id}>
              <div>
                <BookOpen />
                <div>
                  <strong>{tutorial.title}</strong>
                  <small>{tutorial.is_published ? 'Published' : 'Hidden'} · order {tutorial.sort_order}</small>
                </div>
              </div>
              <div className={styles.tutorialAdminActions}>
                <a href={tutorial.video_url} target="_blank" rel="noreferrer">Open video</a>
                <form action={manageTutorial}>
                  <input type="hidden" name="id" value={tutorial.id} />
                  <button name="intent" value={tutorial.is_published ? 'unpublish' : 'publish'} type="submit">
                    {tutorial.is_published ? <EyeOff /> : <Eye />}
                    {tutorial.is_published ? 'Hide' : 'Publish'}
                  </button>
                </form>
                <form action={manageTutorial}>
                  <input type="hidden" name="id" value={tutorial.id} />
                  <button name="intent" value="delete" type="submit" className={styles.tutorialDelete}>
                    <Trash2 /> Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
          {!tutorials.length && <p>No tutorials have been added yet.</p>}
        </div>
      </section>
    </main>
  );
}
