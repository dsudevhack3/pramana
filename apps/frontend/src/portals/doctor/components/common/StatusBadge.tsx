/**
 * See the conflict note in ./Button.tsx.
 *
 * The only thing genuinely local here is the mapping from this app's domain
 * enums to the shared Badge's status vocabulary - that mapping IS app
 * knowledge, so it belongs in the app rather than in the shared package.
 */
import { Badge } from '@pramana/ui-components';
import type { BadgeStatus } from '@pramana/ui-components';
import type { GovtVerificationStatus, PlatformRegistrationStatus, PrescriptionState } from '@pramana/types';

const GOVT: Record<GovtVerificationStatus, { status: BadgeStatus; label: string }> = {
  UNVERIFIED: { status: 'idle', label: 'Not started' },
  IN_REVIEW: { status: 'pending', label: 'With a reviewer' },
  VERIFIED: { status: 'verified', label: 'Verified' },
  REJECTED: { status: 'rejected', label: 'Rejected' },
  REVOKED: { status: 'suspended', label: 'Licence revoked' },
};

const PLATFORM: Record<PlatformRegistrationStatus, { status: BadgeStatus; label: string }> = {
  NOT_REGISTERED: { status: 'idle', label: 'Not registered' },
  PENDING: { status: 'pending', label: 'Awaiting approval' },
  ACTIVE: { status: 'verified', label: 'Active' },
  SUSPENDED: { status: 'suspended', label: 'Suspended' },
};

const PRESCRIPTION: Record<PrescriptionState, { status: BadgeStatus; label: string }> = {
  SEALED: { status: 'sealed', label: 'Sealed' },
  CONSUMED: { status: 'verified', label: 'Dispensed' },
  VOIDED: { status: 'rejected', label: 'Voided' },
  AMENDED: { status: 'pending', label: 'Amended' },
};

export function GovtStatusBadge({ status }: { status: GovtVerificationStatus }) {
  return <Badge {...GOVT[status]} />;
}

export function PlatformStatusBadge({ status }: { status: PlatformRegistrationStatus }) {
  return <Badge {...PLATFORM[status]} />;
}

export function PrescriptionStateBadge({ state }: { state: PrescriptionState }) {
  return <Badge {...PRESCRIPTION[state]} />;
}
