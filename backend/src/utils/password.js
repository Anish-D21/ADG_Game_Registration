/**
 * @file password.js
 * @description Password hashing using Node's built-in scrypt.
 *
 * Uses node:crypto rather than bcrypt so there is no native dependency to compile
 * on the host. Stored format is `scrypt$<salt-hex>$<hash-hex>`.
 */

import crypto from 'crypto';

const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, KEY_LENGTH).toString('hex');
  return `${PREFIX}$${salt}$${hash}`;
}

/**
 * Constant-time comparison against a stored hash.
 * Returns false for anything that is not in our hash format, so a record still
 * holding a plaintext password can never authenticate.
 */
export function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || !stored.startsWith(`${PREFIX}$`)) {
    return false;
  }
  const [, salt, expected] = stored.split('$');
  if (!salt || !expected) return false;

  const actual = crypto.scryptSync(String(plain), salt, KEY_LENGTH);
  const expectedBuf = Buffer.from(expected, 'hex');
  if (actual.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actual, expectedBuf);
}

export default { hashPassword, verifyPassword };
