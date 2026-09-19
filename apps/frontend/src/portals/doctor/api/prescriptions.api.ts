import { ROUTES, newIdempotencyKey } from '@pramana/api-client';
import type {
  DrugCatalogEntry,
  Page,
  PageQuery,
  PatientRiskCheckResult,
  Prescription,
  SignPrescriptionRequest,
} from '@pramana/types';
import { api } from './client';

/** Typeahead against the CDSCO / formulary catalogue. Free text never reaches the record. */
export function searchDrugs(query: string, signal?: AbortSignal) {
  return api.get<DrugCatalogEntry[]>(ROUTES.drugSearch, { query: { q: query, limit: 8 }, signal });
}

export function startPatientOtp(input: { name: string; phone: string; dob: string }) {
  return api.post<{ transaction_id: string; otp_sent_to: string }>(ROUTES.patientOtpStart, input);
}

export function verifyPatientOtp(input: { transaction_id: string; otp: string }) {
  return api.post<{ verified: true; patient_ref: string }>(ROUTES.patientOtpVerify, input);
}

/**
 * Flow 4 to Flow 2 bridge. Read-only and advisory: it surfaces any soft flag on
 * the patient so the prescriber has the context a PDMP would give them. It
 * never blocks signing and it never returns a "deny" verdict, because the
 * product does not have one for patients.
 */
export function checkPatientRisk(input: { phone: string; dob: string }, signal?: AbortSignal) {
  return api.post<PatientRiskCheckResult>(ROUTES.patientRiskCheck, input, { signal });
}

/**
 * The signature and idempotency key are produced on the client before this is
 * called. The server verifies the signature against the stored public key,
 * stamps the doctor's CURRENT licence status onto the record permanently, and
 * appends to the hash chain. There is no update path - only an amendment that
 * creates a new record.
 */
export function signPrescription(request: SignPrescriptionRequest) {
  return api.post<Prescription>(ROUTES.prescriptionSign, request, {
    idempotencyKey: request.idempotency_key,
  });
}

export function listPrescriptions(query: PageQuery & { state?: string } = {}) {
  return api.get<Page<Prescription>>(ROUTES.prescriptionList, { query });
}

export function getPrescription(reference: string) {
  return api.get<Prescription>(`${ROUTES.prescriptionList}/${reference}`);
}

export function voidPrescription(reference: string, reason: string) {
  return api.post<Prescription>(`${ROUTES.prescriptionList}/${reference}/void`, { reason }, {
    idempotencyKey: newIdempotencyKey(),
  });
}
