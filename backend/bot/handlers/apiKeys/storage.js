// handlers/apiKeys/storage.js
const db = require('../../../config/db');
const { encryptApiKey } = require('./crypto');

// Хранилище для отслеживания состояний диалогов пользователей
const userStates = new Map();

/**
 * Получение пользовательских API ключей для биржи
 */
async function getUserExchangeKeys(userId, exchange) {
  const userKeyQuery = `
    SELECT id, api_key, is_active 
    FROM user_api_keys 
    WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1) 
    AND exchange = $2
  `;
  
  return await db.query(userKeyQuery, [userId, exchange]);
}

/**
 * Сохранение API ключа в базе данных
 */
async function saveApiKey(userId, exchange, apiKey, apiSecret, passphrase = null) {
  // Получаем ID пользователя из базы данных
  const userQuery = `SELECT id FROM users WHERE telegram_id = $1`;
  const userResult = await db.query(userQuery, [userId]);
  
  if (userResult.rows.length === 0) {
    throw new Error('Пользователь не найден');
  }
  
  const dbUserId = userResult.rows[0].id;
  
  // Шифруем ключи
  const encryptedApiKey = encryptApiKey(apiKey);
  const encryptedApiSecret = encryptApiKey(apiSecret);
  const encryptedPassphrase = passphrase ? encryptApiKey(passphrase) : null;
  
  // Проверяем, существует ли уже ключ для этой биржи
  const checkQuery = `
    SELECT id FROM user_api_keys
    WHERE user_id = $1 AND exchange = $2
  `;
  const checkResult = await db.query(checkQuery, [dbUserId, exchange]);
  
  if (checkResult.rows.length > 0) {
    // Обновляем существующий ключ
    const updateQuery = `
      UPDATE user_api_keys
      SET api_key = $1, api_secret = $2, passphrase = $3, is_active = TRUE
      WHERE user_id = $4 AND exchange = $5
    `;
    await db.query(updateQuery, [encryptedApiKey, encryptedApiSecret, encryptedPassphrase, dbUserId, exchange]);
  } else {
    // Добавляем новый ключ
    const insertQuery = `
      INSERT INTO user_api_keys (user_id, exchange, api_key, api_secret, passphrase, is_active)
      VALUES ($1, $2, $3, $4, $5, TRUE)
    `;
    await db.query(insertQuery, [dbUserId, exchange, encryptedApiKey, encryptedApiSecret, encryptedPassphrase]);
  }
  
  return true;
}

/**
 * Удаление API ключа пользователя
 */
async function deleteUserApiKey(userId, exchange) {
  // Получаем ID пользователя из базы данных
  const userQuery = `SELECT id FROM users WHERE telegram_id = $1`;
  const userResult = await db.query(userQuery, [userId]);
  
  if (userResult.rows.length === 0) {
    throw new Error('Пользователь не найден');
  }
  
  const dbUserId = userResult.rows[0].id;
  
  // Удаляем ключ
  const deleteQuery = `
    DELETE FROM user_api_keys
    WHERE user_id = $1 AND exchange = $2
  `;
  return await db.query(deleteQuery, [dbUserId, exchange]);
}

module.exports = {
  userStates,
  getUserExchangeKeys,
  saveApiKey,
  deleteUserApiKey
};