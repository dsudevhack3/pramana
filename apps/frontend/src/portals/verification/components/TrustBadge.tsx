import { TrustTierBadge } from '@pramana/ui-components';
import type { TrustTierResult } from '@pramana/types';

/**
 * Thin adapter, not a second implementation (SS5/SS10).
 *
 * The backend returns the tier and the subtext it wants shown; this maps that
 * response onto the shared component so the pharmacist and the doctor are
 * looking at literally the same badge.
 */
export function TrustBadge({ trust, size = 'hero' }: { trust: TrustTierResult; size?: 'hero' | 'inline' }) {
  const subtext =
    trust.tier === 1 && trust.organization_name
      ? `Licence confirmed at signing, and the prescriber was affiliated with ${trust.organization_name} at that moment.`
      : trust.subtext;

  return <TrustTierBadge tier={trust.tier} size={size} subtext={subtext} />;
}
