import { fromBase64Url, toBase64Url } from './canonical';

/**
 * Local key vault.
 *
 * The private key is wrapped with AES-GCM under a key derived from the holder's
 * passphrase (PBKDF2-SHA256, 310,000 iterations - the OWASP 2023 floor) and
 * stored in IndexedDB. Nothing here ever touches the network, and the
 * passphrase is never persisted: unlocking is required once per session, and
 * the unwrapped CryptoKey lives only in memory.
 */
const DB_NAME = 'pramana-vault';
const STORE = 'keys';
const PBKDF2_ITERATIONS = 310_000;

export interface WrappedKey {
  /** Identifies whose key this is: a doctor id or an admin id. */
  ownerId: string;
  wrappedPrivateKey: string;
  salt: string;
  iv: string;
  publicKeyBase64Url: string;
  fingerprint: string;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'ownerId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deriveWrappingKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

export async function storeKey(
  ownerId: string,
  privateKey: CryptoKey,
  publicKeyBase64Url: string,
  keyFingerprint: string,
  passphrase: string,
): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveWrappingKey(passphrase, salt);
  const wrapped = await crypto.subtle.wrapKey('pkcs8', privateKey, wrappingKey, { name: 'AES-GCM', iv });

  const record: WrappedKey = {
    ownerId,
    wrappedPrivateKey: toBase64Url(wrapped),
    salt: toBase64Url(salt),
    iv: toBase64Url(iv),
    publicKeyBase64Url,
    fingerprint: keyFingerprint,
    createdAt: new Date().toISOString(),
  };
  await tx('readwrite', (store) => store.put(record));
}

export async function loadWrappedKey(ownerId: string): Promise<WrappedKey | undefined> {
  return tx('readonly', (store) => store.get(ownerId) as IDBRequest<WrappedKey | undefined>);
}

export async function hasKey(ownerId: string): Promise<boolean> {
  return Boolean(await loadWrappedKey(ownerId));
}

/** Throws a message meant to be shown verbatim when the passphrase is wrong. */
export async function unlockKey(ownerId: string, passphrase: string): Promise<CryptoKey> {
  const record = await loadWrappedKey(ownerId);
  if (!record) {
    throw new Error('No signing key is set up in this browser. Generate one to start signing again.');
  }
  const wrappingKey = await deriveWrappingKey(passphrase, fromBase64Url(record.salt));
  try {
    return await crypto.subtle.unwrapKey(
      'pkcs8',
      fromBase64Url(record.wrappedPrivateKey),
      wrappingKey,
      { name: 'AES-GCM', iv: fromBase64Url(record.iv) },
      { name: 'Ed25519' },
      false,
      ['sign'],
    );
  } catch {
    throw new Error('That passphrase does not unlock this key. Try again, or set up a new key on this device.');
  }
}

export async function forgetKey(ownerId: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(ownerId));
}
