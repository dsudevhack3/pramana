import { useCallback, useEffect, useState } from 'react';
import { hasKey, unlockKey } from '@pramana/crypto';
import { getAdminProfile, type AdminProfile } from '../api/admin.api';

/**
 * (Added file - the provided structure lists no hooks directory for this app,
 * but every enforcement page needs the same unlock state and duplicating it
 * across six pages is exactly what SS10 is trying to prevent.)
 *
 * The unwrapped key lives in a module variable, never in React state or a
 * store - a CryptoKey must not be serialisable into devtools or persisted
 * state.
 */
let unlockedKey: CryptoKey | null = null;

export function getAdminPrivateKey(): CryptoKey | null {
  return unlockedKey;
}

export function useAdminKey() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [unlocked, setUnlocked] = useState(Boolean(unlockedKey));
  const [keyOnThisDevice, setKeyOnThisDevice] = useState<boolean | null>(null);

  useEffect(() => {
    getAdminProfile()
      .then(async (p) => {
        setProfile(p);
        setKeyOnThisDevice(await hasKey(p.id));
      })
      .catch(() => setProfile(null));
  }, []);

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!profile) throw new Error('Your admin profile has not loaded yet.');
      unlockedKey = await unlockKey(profile.id, passphrase);
      setUnlocked(true);
    },
    [profile],
  );

  const lock = useCallback(() => {
    unlockedKey = null;
    setUnlocked(false);
  }, []);

  return { profile, unlocked, keyOnThisDevice, unlock, lock, setProfile };
}
