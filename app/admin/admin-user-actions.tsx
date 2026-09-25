'use client';

import { useFormStatus } from 'react-dom';
import { Ban, ShieldCheck, ShieldMinus, Trash2, Undo2 } from 'lucide-react';
import { manageUser } from './actions';
import styles from './admin.module.css';

type Intent = 'promote' | 'demote' | 'ban' | 'unban' | 'delete';

function ActionButton({
  intent,
  label,
  title,
  danger = false,
  disabled = false,
  children,
}: {
  intent: Intent;
  label: string;
  title: string;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      className={danger ? styles.dangerAction : styles.rowAction}
      aria-label={label}
      title={title}
      disabled={pending || disabled}
    >
      {pending ? <span className={styles.spinner} /> : children}
    </button>
  );
}

export function AdminUserActions({
  userId,
  isAdmin,
  isBanned,
  isCurrentUser,
}: {
  userId: string;
  isAdmin: boolean;
  isBanned: boolean;
  isCurrentUser: boolean;
}) {
  function confirmDelete(event: React.SubmitEvent<HTMLFormElement>) {
    if (!window.confirm('Permanently delete this user and their sign-in account? This cannot be undone.')) {
      event.preventDefault();
    }
  }

  return (
    <div className={styles.actions}>
      <form action={manageUser}>
        <input type="hidden" name="userId" value={userId} />
        <ActionButton
          intent={isAdmin ? 'demote' : 'promote'}
          label={isAdmin ? 'Remove admin access' : 'Appoint as admin'}
          title={isCurrentUser ? 'You cannot demote yourself' : isAdmin ? 'Remove admin' : 'Make admin'}
          disabled={isCurrentUser && isAdmin}
        >
          {isAdmin ? <ShieldMinus /> : <ShieldCheck />}
        </ActionButton>
      </form>

      <form action={manageUser}>
        <input type="hidden" name="userId" value={userId} />
        <ActionButton
          intent={isBanned ? 'unban' : 'ban'}
          label={isBanned ? 'Unban user' : 'Ban user'}
          title={isCurrentUser ? 'You cannot ban yourself' : isBanned ? 'Unban user' : 'Ban user'}
          danger={!isBanned}
          disabled={isCurrentUser}
        >
          {isBanned ? <Undo2 /> : <Ban />}
        </ActionButton>
      </form>

      <form action={manageUser} onSubmit={confirmDelete}>
        <input type="hidden" name="userId" value={userId} />
        <ActionButton
          intent="delete"
          label="Delete user"
          title={isCurrentUser ? 'You cannot delete yourself' : 'Delete user'}
          danger
          disabled={isCurrentUser}
        >
          <Trash2 />
        </ActionButton>
      </form>
    </div>
  );
}
