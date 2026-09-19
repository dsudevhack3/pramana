/**
 * Flow 3. One component (<TrustTierBadge />) renders every trust result in
 * every app - the tier is computed server-side at verification time from the
 * status FROZEN onto the record at signing, never re-derived live in the UI.
 */
export type TrustTier = 1 | 2 | 3;

export interface TrustTierResult {
  tier: TrustTier;
  /** "Fully verified" for tiers 1-2, "Doctor verified only" for tier 3. */
  headline: string;
  subtext: string;
  govt_verified: boolean;
  platform_verified: boolean;
  org_affiliated: boolean;
  organization_name: string | null;
}
