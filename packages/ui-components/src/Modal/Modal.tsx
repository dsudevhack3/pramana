import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { Button } from '../Button/Button';
import { Textarea, Field } from '../Input/Input';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';

/**
 * Confirmation and destructive-action dialog.
 *
 * SS5 hard requirement: the `destructive` variant will not enable its confirm
 * button until a non-empty reason has been typed. This applies everywhere the
 * workflow describes an irreversible or compliance-relevant action - suspend,
 * reject, revoke, void - so the reason that lands in the signed admin_action
 * ledger can never be blank.
 *
 * SS6: full-width sheet from the bottom on a phone, centred panel from 640px.
 */
export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  variant?: 'default' | 'destructive';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Receives the typed reason on the destructive variant, '' otherwise. */
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
  reasonLabel?: string;
  reasonHint?: string;
  busy?: boolean;
}

export function Modal({
  open, title, children, variant = 'default',
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onClose,
  reasonLabel = 'Reason, recorded in the signed ledger',
  reasonHint = 'State the rule and the evidence this action cites.',
  busy = false,
}: ModalProps) {
  const destructive = variant === 'destructive';
  const [reason, setReason] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reasonId = useId();

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) { setReason(''); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('textarea, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirmDisabled = destructive && reason.trim().length === 0;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center bg-ink/50 backdrop-blur-[2px]',
        'items-end sm:items-center sm:p-6',
      )}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'flex max-h-[86dvh] w-full flex-col gap-5 overflow-auto bg-surface p-5',
          'rounded-t-card sm:max-w-[520px] sm:rounded-card',
          'motion-safe:animate-[pramana-field-in_var(--dur-quick)_var(--ease-out)]',
        )}
      >
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-title">{title}</h2>
          <div className="max-w-measure text-body-sm text-muted">{children}</div>
        </div>

        {destructive ? (
          <Field
            label={reasonLabel}
            htmlFor={reasonId}
            help="Required. This text is signed with your key and shown to the account holder, so write it as the explanation they will read."
            unbounded
          >
            <Textarea
              id={reasonId}
              value={reason}
              placeholder={reasonHint}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
          <Button
            variant={destructive ? 'destructive' : 'ink'}
            disabled={confirmDisabled}
            loading={busy}
            loadingLabel="Signing"
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
