import { ROUTES } from '@pramana/api-client';
import type {
  AdminKey, Doctor, Page, PageQuery, Pharmacy, LicenseStatusHistoryEntry,
} from '@pramana/types';
import { api } from './client';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  signing_key: AdminKey | null;
}

export function getMe() {
  return api.get<AdminProfile>('/admin/me');
}

export function registerAdminKey(input: { public_key: string; fingerprint: string; proof_signature: string }) {
  return api.post<AdminKey>(ROUTES.adminKey, input);
}

/* ---- Flow 0/1 review queues ------------------------------------------------
   These are onboarding reviews, not enforcement: a partial licence match or a
   new pharmacy waiting for approval. They still produce signed actions. */

export function listDoctorReviews(query: PageQuery & { status?: string } = {}) {
  return api.get<Page<Doctor>>(ROUTES.adminDoctorReviews, { query });
}

export function getDoctorReview(doctorId: string) {
  return api.get<Doctor & { license_history: LicenseStatusHistoryEntry[] }>(
    `${ROUTES.adminDoctorReviews}/${doctorId}`,
  );
}

export function listPharmacyReviews(query: PageQuery & { status?: string } = {}) {
  return api.get<Page<Pharmacy>>(ROUTES.adminPharmacyReviews, { query });
}

export function getPharmacyReview(pharmacyId: string) {
  return api.get<Pharmacy & { pharmacist_name: string; pharmacist_email: string }>(
    `${ROUTES.adminPharmacyReviews}/${pharmacyId}`,
  );
}

export interface DashboardSummary {
  open_candidates: number;
  candidates_by_severity: { high: number; medium: number; low: number };
  doctors_awaiting_review: number;
  pharmacies_awaiting_review: number;
  actions_last_7d: number;
  chain_height: number;
  last_integrity_check: string | null;
  integrity_intact: boolean;
}

export function getDashboard() {
  return api.get<DashboardSummary>('/admin/dashboard');
}
