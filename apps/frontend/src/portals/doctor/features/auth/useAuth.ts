import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hasKey, unlockKey } from '@pramana/crypto';
import type { AppDispatch, RootState } from '../../store';
import { loadSession, signedOut, signingUnlockedChanged } from './authSlice';

/**
 * Holds the unwrapped private key for the lifetime of the tab and nowhere else.
 * It is a module-level variable rather than Redux state on purpose: a CryptoKey
 * must never be serialised into a store, devtools timeline or persisted state.
 */
let unlockedPrivateKey: CryptoKey | null = null;

export function getUnlockedPrivateKey(): CryptoKey | null {
  return unlockedPrivateKey;
}

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { doctor, progress, status, error, signingUnlocked } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (status === 'idle') void dispatch(loadSession());
  }, [status, dispatch]);

  const unlockSigning = useCallback(
    async (passphrase: string) => {
      if (!doctor) throw new Error('Sign in before unlocking your signing key.');
      unlockedPrivateKey = await unlockKey(doctor.id, passphrase);
      dispatch(signingUnlockedChanged(true));
    },
    [doctor, dispatch],
  );

  const lockSigning = useCallback(() => {
    unlockedPrivateKey = null;
    dispatch(signingUnlockedChanged(false));
  }, [dispatch]);

  const signOut = useCallback(() => {
    unlockedPrivateKey = null;
    dispatch(signedOut());
  }, [dispatch]);

  const keyExistsHere = useCallback(async () => (doctor ? hasKey(doctor.id) : false), [doctor]);

  /** Every condition that must hold before the sign button is live. */
  const canSign = useMemo(
    () =>
      Boolean(
        doctor &&
          !doctor.is_suspended &&
          doctor.govt_status === 'VERIFIED' &&
          doctor.platform_status === 'ACTIVE' &&
          doctor.signing_key &&
          signingUnlocked,
      ),
    [doctor, signingUnlocked],
  );

  return {
    doctor, progress, status, error,
    signingUnlocked, canSign,
    unlockSigning, lockSigning, signOut, keyExistsHere,
  };
}
