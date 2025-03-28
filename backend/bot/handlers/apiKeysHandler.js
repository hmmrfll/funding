// handlers/apiKeysHandler.js
const db = require('../../config/db');
const crypto = require('crypto');

// Хранилище для отслеживания состояний диалогов пользователей
const userStates = new Map();

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

module.exports = function createApiKeysHandler(bot) {
  // Обработчик callback_query для кнопок
  bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const messageId = query.message.message_id;
    
    try {
      switch(query.data) {
        case 'api_keys_menu':
          // Показываем меню управления API ключами
          await bot.editMessageText(
            `🔑 *Управление API ключами*\n\n` +
            `Выберите биржу для настройки API ключей или просмотра текущих ключей:`,
            {
              chat_id: userId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Paradex', callback_data: 'api_keys_paradex' },
                    { text: 'HyperLiquid', callback_data: 'api_keys_hyperliquid' }
                  ],
                  [{ text: '« Назад', callback_data: 'api_keys_back_to_main' }]
                ]
              }
            }
          );
          break;
          
        case 'api_keys_back_to_main':
          // Возвращаемся к основному меню
          const siteUrl = process.env.FRONTEND_URL || 'https://paradex.hedgie.org';
          
          await bot.editMessageText(
            `Привет, ${query.from.first_name}! Я бот для авторизации в системе фандинг-арбитража.\n\n` +
            `🔍 Чтобы войти в систему, перейдите на сайт и нажмите кнопку "Войти через Telegram".\n\n` +
            `🔑 Для управления API ключами используйте соответствующую кнопку.`,
            {
              chat_id: userId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '🌐 Перейти на сайт', url: siteUrl },
                  ],
                  [
                    { text: '🔑 API keys', callback_data: 'api_keys_menu' }
                  ]
                ]
              }
            }
          );
          break;
          
        case 'api_keys_paradex':
          await handleExchangeKeys(userId, messageId, 'Paradex', query.from.first_name);
          break;
          
        case 'api_keys_hyperliquid':
          await handleExchangeKeys(userId, messageId, 'HyperLiquid', query.from.first_name);
          break;
          
        case 'api_keys_back_to_exchanges':
          // Возвращаемся к списку бирж
          await bot.editMessageText(
            `🔑 *Управление API ключами*\n\n` +
            `Выберите биржу для настройки API ключей или просмотра текущих ключей:`,
            {
              chat_id: userId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Paradex', callback_data: 'api_keys_paradex' },
                    { text: 'HyperLiquid', callback_data: 'api_keys_hyperliquid' }
                  ],
                  [{ text: '« Назад', callback_data: 'api_keys_back_to_main' }]
                ]
              }
            }
          );
          break;
          
        case 'api_keys_add_paradex':
          await startKeyAddition(userId, messageId, 'Paradex');
          break;
          
        case 'api_keys_add_hyperliquid':
          await startKeyAddition(userId, messageId, 'HyperLiquid');
          break;
          
        case 'api_keys_delete_paradex':
          await confirmKeyDeletion(userId, messageId, 'Paradex');
          break;
          
        case 'api_keys_delete_hyperliquid':
          await confirmKeyDeletion(userId, messageId, 'HyperLiquid');
          break;
          
        case 'api_keys_confirm_delete_paradex':
          await deleteApiKey(userId, messageId, 'Paradex');
          break;
          
        case 'api_keys_confirm_delete_hyperliquid':
          await deleteApiKey(userId, messageId, 'HyperLiquid');
          break;
          
        case 'api_keys_cancel_delete':
          // Отмена удаления - возвращаемся к информации о ключах
          const exchange = userStates.get(userId)?.exchange || 'Paradex';
          await handleExchangeKeys(userId, messageId, exchange, query.from.first_name);
          break;
          
        case 'api_keys_cancel_add':
          // Отмена добавления ключа
          const cancelExchange = userStates.get(userId)?.exchange || 'Paradex';
          userStates.delete(userId); // Очищаем состояние
          await handleExchangeKeys(userId, messageId, cancelExchange, query.from.first_name);
          break;
      }
      
      await bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Ошибка при обработке callback_query:', error);
      await bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка. Попробуйте позже.' });
    }
  });
  
  /**
   * Показывает информацию о ключах биржи и опции для управления
   */
  async function handleExchangeKeys(userId, messageId, exchange, firstName) {
    try {
      // Проверяем, есть ли у пользователя API ключи для этой биржи
      const userKeyQuery = `
        SELECT id, api_key, is_active 
        FROM user_api_keys 
        WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1) 
        AND exchange = $2
      `;
      const userKeyResult = await db.query(userKeyQuery, [userId, exchange]);
      
      let keyStatus = '';
      let actionButtons = [];
      
      if (userKeyResult.rows.length > 0) {
        const keyInfo = userKeyResult.rows[0];
        const status = keyInfo.is_active ? 'активен' : 'неактивен';
        
        // Маскируем API ключ для отображения
        const maskedKey = '********';
        
        keyStatus = `*Текущий ключ:* ${maskedKey} (${status})`;
        actionButtons = [
          { text: '🗑️ Удалить ключ', callback_data: `api_keys_delete_${exchange.toLowerCase()}` },
          { text: '🔄 Обновить ключ', callback_data: `api_keys_add_${exchange.toLowerCase()}` }
        ];
      } else {
        keyStatus = `*Ключи не настроены.*\nДобавьте API ключ для ${exchange}, чтобы использовать все возможности платформы.`;
        actionButtons = [
          { text: '➕ Добавить ключ', callback_data: `api_keys_add_${exchange.toLowerCase()}` }
        ];
      }
      
      await bot.editMessageText(
        `🔑 *API ключи для ${exchange}*\n\n` +
        keyStatus + `\n\n` +
        `Для безопасной работы мы рекомендуем создать отдельный API ключ с ограниченным доступом.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              actionButtons,
              [{ text: '« Назад', callback_data: 'api_keys_back_to_exchanges' }]
            ]
          }
        }
      );
    } catch (error) {
      console.error(`Ошибка при получении информации о ключах ${exchange}:`, error);
      
      await bot.editMessageText(
        `🔑 *API ключи для ${exchange}*\n\n` +
        `⚠️ Произошла ошибка при загрузке данных о ключах. Пожалуйста, попробуйте позже.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: 'api_keys_back_to_exchanges' }]
            ]
          }
        }
      );
    }
  }
  
  /**
   * Начинает процесс добавления API ключа
   */
  async function startKeyAddition(userId, messageId, exchange) {
    try {
      // Устанавливаем состояние диалога
      userStates.set(userId, {
        state: 'waiting_api_key',
        exchange: exchange,
        messageId: messageId
      });
      
      // Отправляем сообщение с инструкцией
      await bot.editMessageText(
        `🔑 *Добавление API ключа для ${exchange}*\n\n` +
        `Пожалуйста, отправьте ваш API ключ.\n\n` +
        `*Важно:* все сообщения с вашими API ключами будут автоматически удалены для безопасности.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ Отмена', callback_data: 'api_keys_cancel_add' }]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка при начале добавления ключа:', error);
      userStates.delete(userId);
      
      await bot.editMessageText(
        `🔑 *Добавление API ключа*\n\n` +
        `⚠️ Произошла ошибка. Пожалуйста, попробуйте позже.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: `api_keys_${exchange.toLowerCase()}` }]
            ]
          }
        }
      );
    }
  }
  
  /**
   * Запрашивает подтверждение удаления ключа
   */
  async function confirmKeyDeletion(userId, messageId, exchange) {
    try {
      // Запоминаем биржу для возможной отмены
      userStates.set(userId, { exchange: exchange });
      
      await bot.editMessageText(
        `🗑️ *Удаление API ключа для ${exchange}*\n\n` +
        `Вы уверены, что хотите удалить API ключ для ${exchange}?\n\n` +
        `Это действие нельзя отменить.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Да, удалить', callback_data: `api_keys_confirm_delete_${exchange.toLowerCase()}` },
                { text: '❌ Отмена', callback_data: 'api_keys_cancel_delete' }
              ]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка при подтверждении удаления ключа:', error);
      
      await bot.editMessageText(
        `🗑️ *Удаление API ключа*\n\n` +
        `⚠️ Произошла ошибка. Пожалуйста, попробуйте позже.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: `api_keys_${exchange.toLowerCase()}` }]
            ]
          }
        }
      );
    }
  }
  
  /**
   * Удаляет API ключ из базы данных
   */
  async function deleteApiKey(userId, messageId, exchange) {
    try {
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
      await db.query(deleteQuery, [dbUserId, exchange]);
      
      // Очищаем состояние пользователя
      userStates.delete(userId);
      
      // Показываем сообщение об успехе и возвращаемся к информации о ключах
      await bot.editMessageText(
        `✅ *API ключ удален*\n\n` +
        `API ключ для ${exchange} был успешно удален.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: `api_keys_${exchange.toLowerCase()}` }]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка при удалении API ключа:', error);
      
      await bot.editMessageText(
        `🗑️ *Удаление API ключа*\n\n` +
        `⚠️ Произошла ошибка при удалении ключа. Пожалуйста, попробуйте позже.`,
        {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: `api_keys_${exchange.toLowerCase()}` }]
            ]
          }
        }
      );
    }
  }
  
  /**
   * Сохраняет API ключ в базе данных
   */
  async function saveApiKey(userId, exchange, apiKey, apiSecret, passphrase = null) {
    try {
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
    } catch (error) {
      console.error('Ошибка при сохранении API ключа:', error);
      throw error;
    }
  }
  
  // Обработчик текстовых сообщений для сбора API ключей
  bot.on('message', async (msg) => {
    // Если сообщение не текстовое, игнорируем
    if (!msg.text) return;
    
    const userId = msg.from.id;
    
    // Если у пользователя нет активного состояния диалога, игнорируем
    if (!userStates.has(userId)) return;
    
    const userState = userStates.get(userId);
    
    try {
      // Пытаемся удалить сообщение пользователя для безопасности
      try {
        await bot.deleteMessage(userId, msg.message_id);
      } catch (deleteError) {
        console.warn('Не удалось удалить сообщение:', deleteError);
      }
      
      switch (userState.state) {
        case 'waiting_api_key':
          // Получили API ключ, запрашиваем секрет
          userState.apiKey = msg.text;
          userState.state = 'waiting_api_secret';
          
          await bot.editMessageText(
            `🔑 *Добавление API ключа для ${userState.exchange}*\n\n` +
            `API ключ получен. Теперь отправьте API Secret.`,
            {
              chat_id: userId,
              message_id: userState.messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '❌ Отмена', callback_data: 'api_keys_cancel_add' }]
                ]
              }
            }
          );
          break;
          
        case 'waiting_api_secret':
          // Получили секрет, запрашиваем пассфразу для определенных бирж
          userState.apiSecret = msg.text;
          
          // Для Paradex и некоторых других бирж может потребоваться пассфраза
          if (userState.exchange === 'Paradex') {
            userState.state = 'waiting_passphrase';
            
            await bot.editMessageText(
              `🔑 *Добавление API ключа для ${userState.exchange}*\n\n` +
              `API Secret получен. Теперь отправьте пассфразу (или отправьте "нет", если она не требуется).`,
              {
                chat_id: userId,
                message_id: userState.messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '❌ Отмена', callback_data: 'api_keys_cancel_add' }]
                  ]
                }
              }
            );
          } else {
            // Для бирж без пассфразы сразу сохраняем ключ
            await finalizeKeyAddition(userId, userState);
          }
          break;
          
        case 'waiting_passphrase':
          // Получили пассфразу (или "нет"), сохраняем ключ
          userState.passphrase = msg.text.toLowerCase() === 'нет' ? null : msg.text;
          await finalizeKeyAddition(userId, userState);
          break;
      }
    } catch (error) {
      console.error('Ошибка при обработке API ключей:', error);
      
      // Отправляем сообщение об ошибке
      await bot.sendMessage(
        userId,
        `⚠️ Произошла ошибка при обработке API ключей. Пожалуйста, попробуйте позже.`
      );
      
      // Сбрасываем состояние
      userStates.delete(userId);
    }
  });
  
  /**
   * Завершает процесс добавления ключа
   */
  async function finalizeKeyAddition(userId, userState) {
    try {
      // Сохраняем ключ в базе данных
      await saveApiKey(
        userId,
        userState.exchange,
        userState.apiKey,
        userState.apiSecret,
        userState.passphrase
      );
      
      // Отправляем сообщение об успехе
      await bot.editMessageText(
        `✅ *API ключ сохранен*\n\n` +
        `API ключ для ${userState.exchange} был успешно сохранен.\n\n` +
        `Теперь вы можете использовать все возможности платформы для этой биржи.`,
        {
          chat_id: userId,
          message_id: userState.messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: `api_keys_${userState.exchange.toLowerCase()}` }]
            ]
          }
        }
      );
      
      // Очищаем состояние
      userStates.delete(userId);
    } catch (error) {
      console.error('Ошибка при сохранении API ключа:', error);
      
      await bot.editMessageText(
        `🔑 *Добавление API ключа*\n\n` +
        `⚠️ Произошла ошибка при сохранении API ключа. Пожалуйста, попробуйте позже.`,
        {
          chat_id: userId,
          message_id: userState.messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: `api_keys_${userState.exchange.toLowerCase()}` }]
            ]
          }
        }
      );
      
      // Очищаем состояние
      userStates.delete(userId);
    }
  }
  
  return {
    // Экспортируемые методы для использования извне
    encryptApiKey,
    decryptApiKey
  };
};