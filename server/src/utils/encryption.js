import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_HEX = process.env.FIELD_ENCRYPTION_KEY || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

function getKey() {
  const buf = Buffer.from(KEY_HEX, 'hex');
  if (buf.length !== 32) throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  return buf;
}

export function encrypt(plaintext) {
  if (plaintext == null) return null;
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${ct.toString('hex')}`;
}

export function decrypt(packed) {
  if (!packed || typeof packed !== 'string') return null;
  const [ivHex, tagHex, ctHex] = packed.split('.');
  if (!ivHex || !tagHex || !ctHex) return null;
  try {
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return null;
  }
}

export function maskAadhaar(full) {
  if (!full) return '';
  const digits = String(full).replace(/\D/g, '');
  if (digits.length < 4) return 'XXXX XXXX XXXX';
  const last4 = digits.slice(-4);
  return `XXXX XXXX ${last4}`;
}
