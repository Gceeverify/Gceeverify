import { BookOpen, ExternalLink, PlayCircle } from 'lucide-react';
import { ServicePageShell } from '@/components/service-page-shell';
import { getTutorials } from '@/lib/tutorials';

export const dynamic = 'force-dynamic';

export default async function TutorialsPage() {
  const tutorials = (await getTutorials()).filter(
    (tutorial) => tutorial.is_published,
  );

  return (
    <ServicePageShell
      eyebrow="Help center"
      title="Tutorials"
      description="Clear walkthroughs for funding your wallet, buying services, and managing orders."
    >
      {tutorials.length ? (
        <section className="tutorial-grid">
          {tutorials.map((tutorial) => (
            <article className="tutorial-card" key={tutorial.id}>
              <a href={tutorial.video_url} target="_blank" rel="noreferrer" className="tutorial-preview">
                {tutorial.thumbnail_url ? (
                  <span
                    className="tutorial-thumbnail"
                    style={{ backgroundImage: `url(${tutorial.thumbnail_url})` }}
                    aria-hidden="true"
                  />
                ) : (
                  <BookOpen />
                )}
                <span><PlayCircle /> Watch tutorial</span>
              </a>
              <div>
                <h2>{tutorial.title}</h2>
                {tutorial.description && <p>{tutorial.description}</p>}
                <a href={tutorial.video_url} target="_blank" rel="noreferrer">
                  Open video <ExternalLink />
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="market-surface tutorial-empty">
          <BookOpen />
          <h2>Tutorials are on the way</h2>
          <p>New walkthroughs will appear here as soon as they are published.</p>
        </section>
      )}
    </ServicePageShell>
  );
}
