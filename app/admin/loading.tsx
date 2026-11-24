import Image from 'next/image';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLoading() {
  return (
    <main className={styles.loadingShell} aria-busy="true" aria-live="polite">
      <aside className={styles.loadingSidebar} aria-hidden="true">
        <div className={styles.loadingBrand}>
          <Image
            src="/logo-transparent.png"
            width={40}
            height={40}
            alt=""
            priority
          />
          <span>Gceeverify</span>
        </div>
        <div className={styles.loadingNavLines}>
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </aside>
      <section className={styles.loadingContent}>
        <div className={styles.loadingMessage}>
          <span>
            <ShieldCheck /> Protected admin area
          </span>
          <h1>Opening admin center</h1>
          <p>Loading users, orders, and business activity...</p>
          <LoaderCircle className={styles.loadingSpinner} />
        </div>
        <div className={styles.loadingCards} aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className={styles.loadingPanel} aria-hidden="true" />
      </section>
    </main>
  );
}
