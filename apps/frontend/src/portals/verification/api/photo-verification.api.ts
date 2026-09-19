import { ROUTES } from '@pramana/api-client';
import type { PhotoVerificationResponse } from '@pramana/types';
import { api } from './client';

export function verifyPrescriptionPhoto(file: File, options?: { signal?: AbortSignal }) {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<PhotoVerificationResponse>(ROUTES.photoVerification, formData, {
    signal: options?.signal,
  });
}
