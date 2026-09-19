import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { newIdempotencyKey } from '@pramana/api-client';
import { signPayload } from '@pramana/crypto';
import type { Prescription, PrescriptionPayload } from '@pramana/types';
import type { AppDispatch, RootState } from '../../store';
import { fetchPrescriptions, sealed, sealedCleared } from './prescriptionsSlice';
import { signPrescription } from '../../api/prescriptions.api';
import { getUnlockedPrivateKey } from '../auth/useAuth';

export function usePrescriptions(autoLoad = false) {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((s: RootState) => s.prescriptions);
  const doctor = useSelector((s: RootState) => s.auth.doctor);

  useEffect(() => {
    if (autoLoad && state.status === 'idle') void dispatch(fetchPrescriptions());
  }, [autoLoad, state.status, dispatch]);

  const reload = useCallback(
    (query?: { page?: number; state?: string; q?: string }) => dispatch(fetchPrescriptions(query ?? {})),
    [dispatch],
  );

  /**
   * The signing step, in the order that matters:
   *   1. the idempotency key is minted ONCE, here, and reused on any retry
   *   2. the payload is signed with the in-memory private key
   *   3. only then does anything leave the device
   * If the request fails, the caller retries with the same request object, so a
   * network blip can never produce a second record for the same consultation.
   */
  const signAndSeal = useCallback(
    async (payload: PrescriptionPayload): Promise<Prescription> => {
      const privateKey = getUnlockedPrivateKey();
      if (!privateKey) throw new Error('Unlock your signing key before signing this prescription.');
      if (!doctor?.signing_key) throw new Error('No signing key is registered for your account.');

      const signature = await signPayload(privateKey, payload);
      const record = await signPrescription({
        payload,
        signature,
        public_key_fingerprint: doctor.signing_key.fingerprint,
        idempotency_key: newIdempotencyKey(),
      });

      dispatch(sealed(record));
      return record;
    },
    [doctor, dispatch],
  );

  const clearLastSealed = useCallback(() => dispatch(sealedCleared()), [dispatch]);

  return { ...state, reload, signAndSeal, clearLastSealed };
}
