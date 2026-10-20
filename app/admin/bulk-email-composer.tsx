'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  LoaderCircle,
  Mail,
  Send,
  TriangleAlert,
} from 'lucide-react';
import { sendEmailToAllUsers, type BulkEmailState } from './bulk-email-actions';
import styles from './admin.module.css';

const initialState: BulkEmailState = {
  status: 'idle',
  message: '',
  sent: 0,
  failed: 0,
};

export function BulkEmailComposer({
  recipientCount,
}: {
  recipientCount: number;
}) {
  const [state, formAction, pending] = useActionState(
    sendEmailToAllUsers,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success' && state.failed === 0)
      formRef.current?.reset();
  }, [state.failed, state.status]);

  return (
    <section
      className={styles.emailPanel}
      id="email-users"
      aria-labelledby="bulk-email-title"
    >
      <div className={styles.emailIntro}>
        <span className={styles.emailIcon}>
          <Mail />
        </span>
        <div>
          <span className={styles.eyebrow}>Customer communication</span>
          <h2 id="bulk-email-title">Email all users</h2>
          <p>
            Send one private copy to each of the{' '}
            {recipientCount.toLocaleString()} registered email address
            {recipientCount === 1 ? '' : 'es'}.
          </p>
        </div>
      </div>

      <form ref={formRef} action={formAction} className={styles.emailForm}>
        <label>
          <span>Subject</span>
          <input
            name="subject"
            type="text"
            required
            minLength={1}
            maxLength={150}
            placeholder="Important update from Gceeverify"
            disabled={pending}
          />
        </label>
        <label>
          <span>Message</span>
          <textarea
            name="message"
            required
            minLength={1}
            maxLength={10_000}
            rows={8}
            placeholder="Write the message every user should receive..."
            disabled={pending}
          />
        </label>
        <label className={styles.emailConfirmation}>
          <input name="confirmed" type="checkbox" required disabled={pending} />
          <span>
            I have reviewed this message and want to send it to all{' '}
            {recipientCount.toLocaleString()} users.
          </span>
        </label>

        {state.message && (
          <div
            className={
              state.status === 'success'
                ? styles.emailSuccess
                : styles.emailError
            }
            role={state.status === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {state.status === 'success' ? <CheckCircle2 /> : <TriangleAlert />}
            <span>{state.message}</span>
          </div>
        )}

        <div className={styles.emailSubmitRow}>
          <small>Recipients cannot see anyone else&apos;s email address.</small>
          <button type="submit" disabled={pending || recipientCount === 0}>
            {pending ? (
              <LoaderCircle className={styles.spinnerIcon} />
            ) : (
              <Send />
            )}
            {pending ? 'Sending emails...' : 'Send to all users'}
          </button>
        </div>
      </form>
    </section>
  );
}
