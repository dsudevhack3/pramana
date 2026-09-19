/**
 * See the conflict note in the doctor portal's components/common/Button.tsx:
 * the structure lists app-local common components, the design system says the
 * shared package owns them. What is genuinely local is the enum mapping, and
 * that is all this file contains.
 */
import { Badge } from '@pramana/ui-components';
import type { BadgeStatus } from '@pramana/ui-components';
import type { InviteState, OrganizationStatus } from '@pramana/types';

const ORG: Record<OrganizationStatus, { status: BadgeStatus; label: string }> = {
  PENDING: { status: 'pending', label: 'Submitted' },
  IN_REVIEW: { status: 'pending', label: 'With a reviewer' },
  VERIFIED: { status: 'verified', label: 'Verified' },
  REJECTED: { status: 'rejected', label: 'Rejected' },
};

const INVITE: Record<InviteState, { status: BadgeStatus; label: string }> = {
  SENT: { status: 'pending', label: 'Waiting for a reply' },
  ACCEPTED: { status: 'verified', label: 'Accepted' },
  DECLINED: { status: 'idle', label: 'Declined' },
  EXPIRED: { status: 'idle', label: 'Expired' },
  REVOKED: { status: 'rejected', label: 'Withdrawn' },
};

export function OrgStatusBadge({ status }: { status: OrganizationStatus }) {
  return <Badge {...ORG[status]} />;
}

export function InviteStateBadge({ state }: { state: InviteState }) {
  return <Badge {...INVITE[state]} />;
}
