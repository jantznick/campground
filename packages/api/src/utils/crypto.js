import crypto from 'crypto';
import 'dotenv/config';

const algorithm = 'aes-256-gcm';

const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
if (!process.env.ENCRYPTION_KEY || key.length !== 32) {
	throw new Error('ENCRYPTION_KEY environment variable must be a 32-byte hex string.');
}


export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data for storage.
  // Format: iv:authTag:encryptedData (all in hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(hash) {
  try {
    const [ivHex, authTagHex, encryptedHex] = hash.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted hash format.');
    } 

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return null or re-throw to indicate failure, depending on desired error handling.
    // Throwing is often better to prevent using a partially decrypted/incorrect value.
    throw new Error('Decryption failed.');
  }
} 