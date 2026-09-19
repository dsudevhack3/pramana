import { ROUTES } from '@pramana/api-client';
import type {
  Address, OrgAnalytics, Organization, OrganizationInvite, Page, PageQuery, RosterEntry,
} from '@pramana/types';
import { api } from './client';

/**
 * Flow 0.
 *
 * Note what is absent from this module and stays absent: there is no endpoint
 * to verify a doctor, alter a doctor's licence status, or sign on a doctor's
 * behalf. An org admin cannot do those things, and the reason is not a
 * permission check - the doctor's private key is on the doctor's device, so it
 * is not possible.
 */
export function registryLookup(input: { registration_number: string; registration_type: 'CIN' | 'GST' | 'SHOP_ACT' }) {
  return api.post<{ found: boolean; legal_name: string | null; registered_address: string | null; status: string | null }>(
    '/organizations/registry-lookup',
    input,
    { anonymous: true },
  );
}

export function verifyOrgAddress(input: { address_text: string }) {
  return api.post<{ maps_confirmed: boolean; formatted_address: string | null; place_id: string | null }>(
    '/organizations/verify-address',
    input,
    { anonymous: true },
  );
}

export function onboardOrganization(input: {
  name: string;
  registration_number: string;
  registration_type: 'CIN' | 'GST' | 'SHOP_ACT';
  gst_number: string | null;
  address: Address;
  admin_name: string;
  admin_email: string;
}) {
  return api.post<Organization>(ROUTES.orgOnboard, input, { anonymous: true });
}

export function getMyOrganization() {
  return api.get<Organization>(ROUTES.orgMe);
}

export function getRoster(query: PageQuery = {}) {
  return api.get<Page<RosterEntry>>(ROUTES.orgRoster, { query });
}

export function listInvites() {
  return api.get<OrganizationInvite[]>(ROUTES.orgInvites);
}

export function inviteDoctor(input: { doctor_email: string; doctor_name?: string }) {
  return api.post<OrganizationInvite>(ROUTES.orgInvites, input);
}

export function revokeInvite(inviteId: string) {
  return api.del<void>(`${ROUTES.orgInvites}/${inviteId}`);
}

/** Removes the display affiliation only. The doctor's account is untouched. */
export function removeFromRoster(doctorId: string, reason: string) {
  return api.post<void>(`${ROUTES.orgRoster}/${doctorId}/remove`, { reason });
}

export function getAnalytics(query: { days?: number } = {}) {
  return api.get<OrgAnalytics>(ROUTES.orgAnalytics, { query });
}
