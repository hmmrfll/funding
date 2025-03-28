// handlers/apiKeys/crypto.js
const crypto = require('crypto');

/**
 * Функция для шифрования API ключей
 */
function encryptApiKey(text) {
  const algorithm = 'aes-256-cbc';
  const key = process.env.API_KEY_SECRET || 'default-secret-key-for-api-encryption';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, 
    crypto.createHash('sha256').update(key).digest().slice(0, 32), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Функция для расшифровки API ключей
 */
function decryptApiKey(encrypted) {
  const algorithm = 'aes-256-cbc';
  const key = process.env.API_KEY_SECRET || 'default-secret-key-for-api-encryption';
  
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, 
    crypto.createHash('sha256').update(key).digest().slice(0, 32), iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  encryptApiKey,
  decryptApiKey
};