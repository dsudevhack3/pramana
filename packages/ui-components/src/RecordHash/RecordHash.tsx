import { useState } from 'react';
import type { Sha256Hex } from '@pramana/types';
import { cn } from '../lib/cn';
import { Icon } from '../Icon/Icon';

/**
 * SS5: monospace, middle-truncated, click-to-copy, and ALWAYS preceded by a
 * plain-language caption explaining what the hash proves. A bare hex string
 * with no caption must never appear anywhere in the product - `caption` is
 * therefore required, not optional.
 */
export function RecordHash({
  hash, caption, className,
}: {
  hash: Sha256Hex;
  caption: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const short = `${hash.slice(0, 10)}\u2026${hash.slice(-8)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-caption text-muted">{caption}</span>
      <button
        type="button"
        onClick={copy}
        title={hash}
        className={cn(
          'flex min-h-touch w-full items-center gap-2 rounded-control border border-transparent',
          'bg-canvas-2 px-3 py-2 text-left hover:border-line',
          'transition-colors duration-instant ease-out',
        )}
      >
        <Icon name="hash" size={15} className="text-muted" />
        <span className="min-w-0 flex-1 truncate font-mono text-mono text-ink-2">{short}</span>
        <span className="flex items-center gap-1 text-caption text-muted">
          <Icon name={copied ? 'check' : 'copy'} size={15} />
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
    </div>
  );
}
