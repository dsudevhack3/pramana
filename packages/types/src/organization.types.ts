import type { ISODateTime, UUID, Address } from './common.types';

export type OrganizationStatus = 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';

/**
 * Flow 0. Org VERIFIED does NOT mean its doctors are verified - every doctor
 * still completes Flow 1 independently. Org-admins never touch a doctor's
 * signing key and can never sign on their behalf.
 */
export interface Organization {
  id: UUID;
  name: string;
  registration_number: string;
  registration_type: 'CIN' | 'GST' | 'SHOP_ACT';
  gst_number: string | null;
  address: Address;
  registry_confirmed: boolean;
  maps_confirmed: boolean;
  status: OrganizationStatus;
  verified_at: ISODateTime | null;
  doctor_count: number;
}

export type InviteState = 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';

export interface OrganizationInvite {
  id: UUID;
  organization_id: UUID;
  organization_name: string;
  doctor_email: string;
  doctor_name: string | null;
  state: InviteState;
  sent_at: ISODateTime;
  responded_at: ISODateTime | null;
}

/** Roster row. Trust columns are the doctor's own, never inherited from the org. */
export interface RosterEntry {
  doctor_id: UUID;
  doctor_name: string;
  license_number: string;
  govt_verified: boolean;
  platform_active: boolean;
  is_suspended: boolean;
  prescriptions_30d: number;
  joined_at: ISODateTime;
}

export interface OrgAnalytics {
  prescriptions_30d: number;
  prescriptions_prev_30d: number;
  active_prescribers: number;
  sealed_share: number;
  consumed_share: number;
  /** Doctors whose licence expires within 60 days - amber, not scarlet. */
  licenses_expiring_soon: number;
  by_day: Array<{ date: string; count: number }>;
}
