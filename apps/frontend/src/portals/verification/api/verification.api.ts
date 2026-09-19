import { ROUTES, newIdempotencyKey } from '@pramana/api-client';
import type { ConsumeTokenResult, VerificationResult } from '@pramana/types';
import { api } from './client';

/**
 * Flow 3.
 *
 * Resolution is anonymous on purpose: a patient checking their own prescription
 * on their phone should not need an account. Consuming a token is not - that
 * requires an approved, unsuspended pharmacist, because it is the step that
 * changes state.
 */
export function resolvePrescription(input: { token?: string; reference?: string }) {
  return api.post<VerificationResult>(ROUTES.verify, input, { anonymous: true });
}

export function consumeToken(input: { token: string }) {
  return api.post<ConsumeTokenResult>(ROUTES.consume, input, {
    idempotencyKey: newIdempotencyKey(),
  });
}
