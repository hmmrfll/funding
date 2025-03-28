// handlers/apiKeys/index.js
const { userStates } = require('./storage');
const { getExchangesMenuMarkup, getMainMenuMarkup } = require('./ui');
const { 
  handleExchangeKeys, 
  startKeyAddition, 
  confirmKeyDeletion, 
  deleteApiKey,
  finalizeKeyAddition 
} = require('./actions');
const { encryptApiKey, decryptApiKey } = require('./crypto');

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
              reply_markup: getExchangesMenuMarkup()
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
              reply_markup: getMainMenuMarkup(siteUrl)
            }
          );
          break;
          
        case 'api_keys_paradex':
          await handleExchangeKeys(bot, userId, messageId, 'Paradex', query.from.first_name);
          break;
          
        case 'api_keys_hyperliquid':
          await handleExchangeKeys(bot, userId, messageId, 'HyperLiquid', query.from.first_name);
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
              reply_markup: getExchangesMenuMarkup()
            }
          );
          break;
          
        case 'api_keys_add_paradex':
          await startKeyAddition(bot, userId, messageId, 'Paradex');
          break;
          
        case 'api_keys_add_hyperliquid':
          await startKeyAddition(bot, userId, messageId, 'HyperLiquid');
          break;
          
        case 'api_keys_delete_paradex':
          await confirmKeyDeletion(bot, userId, messageId, 'Paradex');
          break;
          
        case 'api_keys_delete_hyperliquid':
          await confirmKeyDeletion(bot, userId, messageId, 'HyperLiquid');
          break;
          
        case 'api_keys_confirm_delete_paradex':
          await deleteApiKey(bot, userId, messageId, 'Paradex');
          break;
          
        case 'api_keys_confirm_delete_hyperliquid':
          await deleteApiKey(bot, userId, messageId, 'HyperLiquid');
          break;
          
        case 'api_keys_cancel_delete':
          // Отмена удаления - возвращаемся к информации о ключах
          const exchange = userStates.get(userId)?.exchange || 'Paradex';
          await handleExchangeKeys(bot, userId, messageId, exchange, query.from.first_name);
          break;
          
        case 'api_keys_cancel_add':
          // Отмена добавления ключа
          const cancelExchange = userStates.get(userId)?.exchange || 'Paradex';
          userStates.delete(userId); // Очищаем состояние
          await handleExchangeKeys(bot, userId, messageId, cancelExchange, query.from.first_name);
          break;
      }
      
      await bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Ошибка при обработке callback_query:', error);
      await bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка. Попробуйте позже.' });
    }
  });
  
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
            await finalizeKeyAddition(bot, userId, userState);
          }
          break;
          
        case 'waiting_passphrase':
          // Получили пассфразу (или "нет"), сохраняем ключ
          userState.passphrase = msg.text.toLowerCase() === 'нет' ? null : msg.text;
          await finalizeKeyAddition(bot, userId, userState);
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
  
  return {
    // Экспортируемые методы для использования извне
    encryptApiKey,
    decryptApiKey
  };
};