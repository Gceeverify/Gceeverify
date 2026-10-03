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

function useRememberedDialog(storageKey: string) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(storageKey) !== 'seen');
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, 'seen');
    } catch {
      // The dialog can still close when storage is unavailable.
    }
    setOpen(false);
  };

  return { open, dismiss };
}

export function DashboardWelcomeDialog({ userId }: { userId: string }) {
  const { open, dismiss } = useRememberedDialog(
    `gceeverify:welcome:${userId}:v1`,
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent
        className="welcome-dialog"
        showCloseButton={false}
        aria-describedby="welcome-dialog-description"
      >
        <div className="welcome-dialog-icon" aria-hidden="true">
          <Sparkles />
        </div>
        <p className="information-dialog-eyebrow">Welcome to Gceeverify</p>
        <DialogTitle className="information-dialog-title">
          New to Gceeverify?
        </DialogTitle>
        <DialogDescription
          id="welcome-dialog-description"
          className="information-dialog-description"
        >
          Watch our quick tutorials to learn how to get numbers, buy logs, and
          boost an account.
        </DialogDescription>
        <div className="welcome-dialog-actions">
          <Button
            render={<Link href="/tutorials" />}
            onClick={dismiss}
            className="information-primary-button"
          >
            <CirclePlay /> Watch tutorials
          </Button>
          <Button
            type="button"
            variant="outline"
            className="information-secondary-button"
            onClick={dismiss}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
