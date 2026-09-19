import { canonicalJSON, encodeUtf8, fingerprint, toBase64Url } from './canonical';

/**
 * Flow 1 step 4, and the same primitives for the admin's own key in Flow 5.
 *
 * The private key is generated in the browser, marked extractable ONLY so it
 * can be encrypted with the holder's passphrase before being written to
 * IndexedDB. It is never sent anywhere. The server receives the public half.
 *
 * Ed25519 in WebCrypto is available in Chrome 137+, Safari 17+ and Firefox 129+.
 * Call `assertEd25519Support()` before starting the step so an unsupported
 * browser fails at the top of the flow with a plain explanation, rather than
 * halfway through key generation.
 */
export interface GeneratedKeyPair {
  privateKey: CryptoKey;
  publicKeyRaw: Uint8Array;
  publicKeyBase64Url: string;
  fingerprint: string;
}

export async function assertEd25519Support(): Promise<void> {
  try {
    await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']);
  } catch {
    throw new Error(
      'This browser cannot generate an Ed25519 signing key. Use the latest Chrome, Edge, Safari or Firefox to finish setting up signing.',
    );
  }
}

export async function generateSigningKeyPair(): Promise<GeneratedKeyPair> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;

  const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));

  return {
    privateKey: pair.privateKey,
    publicKeyRaw,
    publicKeyBase64Url: toBase64Url(publicKeyRaw),
    fingerprint: fingerprint(publicKeyRaw),
  };
}

/** Detached Ed25519 signature over the canonical JSON form of `payload`. */
export async function signPayload(privateKey: CryptoKey, payload: unknown): Promise<string> {
  const bytes = encodeUtf8(canonicalJSON(payload));
  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, bytes);
  return toBase64Url(signature);
}

/** Local self-check before upload: proves the pair actually round-trips. */
export async function verifyOwnSignature(
  publicKeyRaw: Uint8Array,
  signatureBase64Url: string,
  payload: unknown,
): Promise<boolean> {
  const key = await crypto.subtle.importKey('raw', publicKeyRaw, { name: 'Ed25519' }, false, ['verify']);
  const { fromBase64Url } = await import('./canonical');
  return crypto.subtle.verify(
    { name: 'Ed25519' },
    key,
    fromBase64Url(signatureBase64Url),
    encodeUtf8(canonicalJSON(payload)),
  );
}
