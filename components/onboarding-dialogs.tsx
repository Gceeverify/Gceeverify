'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, CirclePlay, Phone, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

function useRememberedDialog(storageKey: string, occurrence = 'seen') {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(storageKey) !== occurrence);
    } catch {
      setOpen(true);
    }
  }, [occurrence, storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, occurrence);
    } catch {
      // The dialog can still close when storage is unavailable.
    }
    setOpen(false);
  };

  return { open, dismiss };
}

export function DashboardWelcomeDialog({
  userId,
  signedInAt,
}: {
  userId: string;
  signedInAt: string;
}) {
  const storageKey = `gceeverify:dashboard-dialogs:${userId}:v1`;
  const [phase, setPhase] = useState<'tutorial' | 'numbers' | null>(null);

  useEffect(() => {
    try {
      const savedPhase = localStorage.getItem(storageKey);
      setPhase(
        savedPhase === `${signedInAt}:complete`
          ? null
          : savedPhase === `${signedInAt}:tutorial`
            ? 'numbers'
            : 'tutorial',
      );
    } catch {
      setPhase('tutorial');
    }
  }, [signedInAt, storageKey]);

  const showNumbers = () => {
    try {
      localStorage.setItem(storageKey, `${signedInAt}:tutorial`);
    } catch {
      // The sequence can still continue when storage is unavailable.
    }
    setPhase('numbers');
  };

  const finish = () => {
    try {
      localStorage.setItem(storageKey, `${signedInAt}:complete`);
    } catch {
      // The dialog can still close when storage is unavailable.
    }
    setPhase(null);
  };

  return (
    <>
      <Dialog
        open={phase === 'tutorial'}
        onOpenChange={(nextOpen) => !nextOpen && showNumbers()}
      >
        <DialogContent
          className="welcome-dialog"
          showCloseButton={false}
          aria-describedby="tutorial-dialog-description"
        >
          <div className="welcome-dialog-icon" aria-hidden="true">
            <Sparkles />
          </div>
          <p className="information-dialog-eyebrow">Welcome to Gceeverify</p>
          <DialogTitle className="information-dialog-title">
            New to Gceeverify?
          </DialogTitle>
          <DialogDescription
            id="tutorial-dialog-description"
            className="information-dialog-description"
          >
            Watch our quick tutorials to learn how to get numbers, buy logs, and
            boost an account.
          </DialogDescription>
          <div className="welcome-dialog-actions">
            <Button
              render={<Link href="/tutorials" />}
              nativeButton={false}
              onClick={showNumbers}
              className="information-primary-button"
            >
              <CirclePlay /> Watch tutorials
            </Button>
            <Button
              type="button"
              variant="outline"
              className="information-secondary-button"
              onClick={showNumbers}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={phase === 'numbers'}
        onOpenChange={(nextOpen) => !nextOpen && finish()}
      >
        <DialogContent
          className="welcome-dialog"
          showCloseButton={false}
          aria-describedby="numbers-dialog-description"
        >
          <div className="welcome-dialog-icon" aria-hidden="true">
            <Phone />
          </div>
          <p className="information-dialog-eyebrow">Now available</p>
          <DialogTitle className="information-dialog-title">
            Active foreign numbers are here
          </DialogTitle>
          <DialogDescription
            id="numbers-dialog-description"
            className="information-dialog-description"
          >
            Get affordable foreign numbers that deliver verification codes
            quickly. Choose an available country and service to get started.
          </DialogDescription>
          <div className="welcome-dialog-actions">
            <Button
              render={<Link href="/numbers" />}
              nativeButton={false}
              onClick={finish}
              className="information-primary-button"
            >
              <Phone /> Buy a number
            </Button>
            <Button
              type="button"
              variant="outline"
              className="information-secondary-button"
              onClick={finish}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ServiceInformationDialogProps = {
  kind: 'boost' | 'numbers';
};

const information: Record<
  ServiceInformationDialogProps['kind'],
  {
    eyebrow: string;
    title: string;
    description?: string;
    icon: typeof AlertCircle;
    points?: ReactNode[];
  }
> = {
  boost: {
    eyebrow: 'Before you order',
    title: 'Important information',
    icon: AlertCircle,
    points: [
      'Make sure the account or post is public before ordering.',
      'Do not place two orders for the same link at the same time.',
      'Double-check links before buying because incorrect links may not be refundable.',
      'For views, enter the video link instead of a profile link.',
    ],
  },
  numbers: {
    eyebrow: 'Foreign numbers',
    title: 'Important note',
    icon: Phone,
    description:
      'Numbers are valid for 15 minutes. Please be ready to request the SMS code immediately after generating the number. If a code does not arrive, check the Buy Numbers page for another available route.',
  },
};

export function ServiceInformationDialog({
  kind,
}: ServiceInformationDialogProps) {
  const { open, dismiss } = useRememberedDialog(
    `gceeverify:information:${kind}:v1`,
  );
  const content = information[kind];
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent
        className="service-information-dialog"
        showCloseButton={false}
        aria-describedby="service-information-description"
      >
        <div className="information-dialog-header">
          <div className="information-dialog-icon" aria-hidden="true">
            <Icon />
          </div>
          <div>
            <p className="information-dialog-eyebrow">{content.eyebrow}</p>
            <DialogTitle className="information-dialog-title">
              {content.title}
            </DialogTitle>
          </div>
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="information-dialog-close"
                aria-label="Close information"
              />
            }
            onClick={dismiss}
          >
            <X />
          </DialogClose>
        </div>
        <div id="service-information-description">
          {content.points ? (
            <ul className="information-dialog-list">
              {content.points.map((point) => (
                <li key={String(point)}>{point}</li>
              ))}
            </ul>
          ) : (
            <DialogDescription className="information-dialog-description service-information-copy">
              {content.description}
            </DialogDescription>
          )}
        </div>
        <Button
          type="button"
          className="information-primary-button information-understand-button"
          onClick={dismiss}
        >
          I understand
        </Button>
      </DialogContent>
    </Dialog>
  );
}
