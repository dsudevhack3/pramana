import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Icon } from '../Icon/Icon';

/**
 * SS7.4: a thin gradient sweep traverses the capture frame continuously,
 * proving the feed is live, and stops instantly with a single 200ms colour
 * flash on success. Never a slow celebratory animation on a successful scan -
 * the moment calls for speed, not flourish.
 *
 * SS6: full-bleed on a phone; on wide layouts the page places this in a fixed
 * ~420px panel beside a manual-entry field of equal visual weight. Never a
 * webcam feed stretched across a monitor.
 *
 * SS8: every scan surface must have a working typed fallback. This component
 * renders `fallback` inside the frame whenever the camera is unavailable, so a
 * denied permission is never a dead end.
 */
export function ScanFrame({
  videoRef, state, hint, fallback, className,
}: {
  videoRef?: React.RefObject<HTMLVideoElement>;
  state: 'idle' | 'scanning' | 'hit' | 'denied';
  hint?: string;
  /** Shown when the camera is denied or unavailable. */
  fallback?: ReactNode;
  className?: string;
}) {
  const denied = state === 'denied';

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'relative aspect-square overflow-hidden rounded-card border border-line bg-canvas-2',
          state === 'hit' && 'scan-hit border-tourmaline',
          className,
        )}
      >
        {!denied && videoRef ? (
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
            aria-label="Live camera view for scanning a prescription QR code"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
            <Icon name={denied ? 'camera' : 'scan'} size={28} className="text-muted" />
            <p className="max-w-measure text-body-sm text-muted">
              {denied
                ? 'The camera is not available. Enter the prescription reference instead.'
                : (hint ?? 'Point the camera at the QR code on the prescription.')}
            </p>
            {fallback}
          </div>
        )}

        {state === 'scanning' ? (
          <div
            aria-hidden
            className="scan-sweep pointer-events-none absolute inset-x-0 h-[34%] bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--tourmaline)_26%,transparent),transparent)]"
          />
        ) : null}

        {/* Corner brackets: the only decoration, and they mark the capture area. */}
        {(['left-4 top-4 border-r-0 border-b-0', 'right-4 top-4 border-l-0 border-b-0',
           'left-4 bottom-4 border-r-0 border-t-0', 'right-4 bottom-4 border-l-0 border-t-0'] as const)
          .map((pos) => (
            <span key={pos} aria-hidden className={cn('absolute size-6 border-2 border-ink-3/50', pos)} />
          ))}
      </div>

      <p aria-live="polite" className="text-caption text-muted">
        {state === 'scanning' && 'Looking for a code.'}
        {state === 'hit' && 'Code read. Checking the record.'}
        {state === 'idle' && 'Camera paused.'}
        {state === 'denied' && 'Camera permission denied.'}
      </p>
    </div>
  );
}
