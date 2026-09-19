import type { TrustTier } from '@pramana/types';
import { cn } from '../lib/cn';
import { Icon, type IconName } from '../Icon/Icon';

/**
 * One component, semantically identical wherever the workflow shows a trust
 * result - the Flow 3 verification screen, a prescription detail, a doctor's
 * own status page. The tier is always computed server-side from the status
 * frozen at signing; this component never derives it.
 *
 * SS1.3: verified states are deep tourmaline, never bright or saturated green.
 * A verified result should feel like a certificate stamp, not a success toast.
 *
 * SS7: trust results never animate. A verified result that fades in reads as
 * uncertain. These are findings of fact and appear instantly.
 */
const TIER: Record<
  TrustTier,
  { headline: string; defaultSub: string; icon: IconName; gradient: string }
> = {
  1: {
    headline: 'Fully verified',
    defaultSub:
      'Government identity, medical licence and platform provenance were all confirmed at the moment this was signed.',
    icon: 'shieldCheck',
    gradient: 'bg-[linear-gradient(135deg,var(--tourmaline),color-mix(in_srgb,var(--tourmaline)_55%,var(--ink)))]',
  },
  2: {
    headline: 'Fully verified',
    defaultSub:
      'Government identity and licence confirmed. Independent practice, with no organisation affiliation.',
    icon: 'shield',
    gradient: 'bg-[linear-gradient(135deg,var(--ink-3),var(--ink))]',
  },
  3: {
    headline: 'Doctor verified only',
    defaultSub:
      'The licence is genuine, but this prescription carries no in-system provenance record.',
    icon: 'alertTriangle',
    gradient: 'bg-[linear-gradient(135deg,var(--amber),color-mix(in_srgb,var(--amber)_55%,var(--ink)))]',
  },
};

export interface TrustTierBadgeProps {
  tier: TrustTier;
  size?: 'hero' | 'inline';
  /** Overrides the default subtext, e.g. to name the affiliated organisation. */
  subtext?: string;
  className?: string;
}

export function TrustTierBadge({ tier, size = 'hero', subtext, className }: TrustTierBadgeProps) {
  const meta = TIER[tier];

  if (size === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-qr-white',
          meta.gradient,
          className,
        )}
      >
        <Icon name={meta.icon} size={18} />
        <span className="font-ui text-body-sm font-semibold">{meta.headline}</span>
      </span>
    );
  }

  return (
    <div
      className={cn('flex items-start gap-4 rounded-hero p-5 text-qr-white', meta.gradient, className)}
      role="status"
    >
      <Icon name={meta.icon} size={34} className="mt-1" />
      <div className="flex flex-col gap-1">
        <h2 className="text-title text-qr-white">{meta.headline}</h2>
        <p className="max-w-measure text-body-sm text-qr-white/80">{subtext ?? meta.defaultSub}</p>
      </div>
    </div>
  );
}
