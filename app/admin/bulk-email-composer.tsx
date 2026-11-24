'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  LoaderCircle,
  Mail,
  MailCheck,
  Send,
  TriangleAlert,
} from 'lucide-react';
import {
  sendEmailToAllUsers,
  sendTestEmailToAdmin,
  type BulkEmailState,
} from './bulk-email-actions';
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
  const [testState, testFormAction, testPending] = useActionState(
    sendTestEmailToAdmin,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = pending || testPending;

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
            Send private, tracked daily batches to the{' '}
            {recipientCount.toLocaleString()} registered email address
            {recipientCount === 1 ? '' : 'es'}. Each user receives the exact
            campaign only once.
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
            disabled={submitting}
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
            placeholder="Write the message every user should receive. The greeting is added automatically..."
            disabled={submitting}
          />
        </label>
        <label className={styles.emailConfirmation}>
          <input
            name="confirmed"
            type="checkbox"
            required
            disabled={submitting}
          />
          <span>
            I have reviewed this message and want to send the next batch of up
            to 450 users. I will keep the subject and message unchanged until
            the campaign is complete.
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

        {testState.message && (
          <div
            className={
              testState.status === 'success'
                ? styles.emailSuccess
                : styles.emailError
            }
            role={testState.status === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {testState.status === 'success' ? (
              <CheckCircle2 />
            ) : (
              <TriangleAlert />
            )}
            <span>{testState.message}</span>
          </div>
        )}

        <div className={styles.emailSubmitRow}>
          <small>
            Test first. Broadcast batches are private and tracked per user.
          </small>
          <div className={styles.emailButtons}>
            <button
              type="submit"
              formAction={testFormAction}
              formNoValidate
              className={styles.testEmailButton}
              disabled={submitting}
            >
              {testPending ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : (
                <MailCheck />
              )}
              {testPending ? 'Sending test...' : 'Send test to me'}
            </button>
            <button type="submit" disabled={submitting || recipientCount === 0}>
              {pending ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : (
                <Send />
              )}
              {pending ? 'Sending batch...' : 'Send next batch (up to 450)'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
