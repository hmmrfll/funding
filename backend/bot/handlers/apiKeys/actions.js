// handlers/apiKeys/actions.js
const { userStates, getUserExchangeKeys, saveApiKey, deleteUserApiKey } = require('./storage');
const { getExchangeKeysMarkup, getDeleteConfirmMarkup } = require('./ui');

/**
 * Показывает информацию о ключах биржи и опции для управления
 */
async function handleExchangeKeys(bot, userId, messageId, exchange, firstName) {
  try {
    // Проверяем, есть ли у пользователя API ключи для этой биржи
    const userKeyResult = await getUserExchangeKeys(userId, exchange);
    
    let keyStatus = '';
    const hasKeys = userKeyResult.rows.length > 0;
    
    if (hasKeys) {
      const keyInfo = userKeyResult.rows[0];
      const status = keyInfo.is_active ? 'активен' : 'неактивен';
      
      // Маскируем API ключ для отображения
      const maskedKey = '********';
      
      keyStatus = `*Текущий ключ:* ${maskedKey} (${status})`;
    } else {
      keyStatus = `*Ключи не настроены.*\nДобавьте API ключ для ${exchange}, чтобы использовать все возможности платформы.`;
    }
    
    await bot.editMessageText(
      `🔑 *API ключи для ${exchange}*\n\n` +
      keyStatus + `\n\n` +
      `Для безопасной работы мы рекомендуем создать отдельный API ключ с ограниченным доступом.`,
      {
        chat_id: userId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: getExchangeKeysMarkup(hasKeys, exchange)
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
async function startKeyAddition(bot, userId, messageId, exchange) {
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
async function confirmKeyDeletion(bot, userId, messageId, exchange) {
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
        reply_markup: getDeleteConfirmMarkup(exchange)
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
async function deleteApiKey(bot, userId, messageId, exchange) {
  try {
    // Удаляем ключ
    await deleteUserApiKey(userId, exchange);
    
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
 * Завершает процесс добавления ключа
 */
async function finalizeKeyAddition(bot, userId, userState) {
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

module.exports = {
  handleExchangeKeys,
  startKeyAddition,
  confirmKeyDeletion,
  deleteApiKey,
  finalizeKeyAddition
};