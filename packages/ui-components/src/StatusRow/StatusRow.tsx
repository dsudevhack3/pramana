import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Label / value / status triple. Used in every "here is what we verified about
 * you or this record" summary across all four apps, so those screens stay
 * identical in rhythm even though they live in different codebases.
 *
 * SS6: the row restructures against ITS OWN width via a container query, not
 * the viewport - the same component sits in a full-width panel and in a narrow
 * sidebar card.
 */
export function StatusRow({
  label, value, status, mono = false, className,
}: {
  label: string;
  value: ReactNode;
  /** Usually a <Badge />. */
  status?: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid items-center gap-3 border-b border-line-2 py-3 last:border-b-0',
        'grid-cols-[minmax(120px,0.8fr)_minmax(0,1.4fr)_auto]',
        '@max-[460px]:grid-cols-[1fr_auto]',
        className,
      )}
    >
      <span className="text-body-sm text-muted @max-[460px]:col-span-full">{label}</span>
      <span className={cn('min-w-0 break-words font-medium', mono && 'font-mono text-mono')}>
        {value}
      </span>
      <span>{status}</span>
    </div>
  );
}
