/**
 * Client-side id generation.
 *
 * UUID v4 shape so a device can mint the primary key for a row before it ever
 * reaches the server — that is what makes an offline retry idempotent.
 *
 * `Math.random` is fine here: these ids are not secrets, they only need to be
 * unique per household. `crypto.randomUUID` is not available on every Hermes
 * build, and adding `expo-crypto` just for this is not worth a dependency.
 */
export function createId(): string {
  const bytes = new Uint8Array(16);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  // RFC 4122: version 4, variant 10xx.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
