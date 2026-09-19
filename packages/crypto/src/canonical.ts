/**
 * Canonical JSON serialisation.
 *
 * The signature must cover the SAME bytes the backend verifies, so key order
 * can never depend on how an object was built. Keys are sorted, undefined is
 * dropped, and no whitespace is emitted. This must stay byte-identical to the
 * backend's canonicalisation in core/security/crypto/signer.py.
 */
export function canonicalJSON(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) {
      if (src[key] === undefined) continue;
      out[key] = sortDeep(src[key]);
    }
    return out;
  }
  return value;
}

export function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Grouped hex fingerprint, for the mono strings a human compares by eye. */
export function fingerprint(publicKeyRaw: Uint8Array): string {
  const hex = Array.from(publicKeyRaw.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
  return `ed25519:${hex.match(/.{1,4}/g)!.join(' ')}`;
}
