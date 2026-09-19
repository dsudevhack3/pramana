import { cn } from '../lib/cn';
import { Icon, type IconName } from '../Icon/Icon';

/**
 * SS1: colour is never the sole carrier of meaning. Every badge renders
 * colour + icon + word, always in that order of redundancy. There is no
 * colour-only mode and none will be added - a greyscale reading of any screen
 * must stay fully comprehensible.
 */
export type BadgeStatus =
  | 'verified'
  | 'sealed'
  | 'pending'
  | 'expiring'
  | 'rejected'
  | 'suspended'
  | 'idle';

const META: Record<BadgeStatus, { icon: IconName; label: string; tone: string }> = {
  verified: {
    icon: 'shieldCheck',
    label: 'Verified',
    tone: 'bg-tourmaline-wash text-tourmaline border-tourmaline/25',
  },
  sealed: {
    icon: 'check',
    label: 'Sealed',
    tone: 'bg-tourmaline-wash text-tourmaline border-tourmaline/25',
  },
  pending: {
    icon: 'clock',
    label: 'Pending review',
    tone: 'bg-amber-wash text-amber border-amber/30',
  },
  expiring: {
    icon: 'clock',
    label: 'Expiring',
    tone: 'bg-amber-wash text-amber border-amber/30',
  },
  rejected: {
    icon: 'x',
    label: 'Rejected',
    tone: 'bg-scarlet-wash text-scarlet border-scarlet/25',
  },
  suspended: {
    icon: 'ban',
    label: 'Suspended',
    tone: 'bg-scarlet-wash text-scarlet border-scarlet/25',
  },
  idle: {
    icon: 'clock',
    label: 'Not started',
    tone: 'bg-canvas-2 text-ink-3 border-line-2',
  },
};

export interface BadgeProps {
  status: BadgeStatus;
  /** Overrides the default word. The word itself is never removable. */
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  const meta = META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border py-1 pl-2 pr-3',
        'text-caption font-semibold whitespace-nowrap',
        meta.tone,
        className,
      )}
    >
      <Icon name={meta.icon} size={13} filled />
      {label ?? meta.label}
    </span>
  );
}
