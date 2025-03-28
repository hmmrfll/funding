// bot/handlers/tradingHandler.js
const paradexTradingService = require('../../services/paradexTradingService');
const hyperliquidTradingService = require('../../services/hyperliquidTradingService');

module.exports = function createTradingHandler(bot) {
  // Состояния пользователей для хранения промежуточных данных
  const userTradingStates = new Map();

  // Обработчик callback_query для кнопок
  bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const data = query.data;
    
    // Пропускаем обработку, если это не торговые операции
    if (!data.startsWith('trade_')) {
      return;
    }
    
    try {
      // Обработка кнопок из основного меню
      if (data === 'trade_menu_open') {
        await bot.editMessageText(
          'Выберите биржу для открытия позиции:',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Paradex', callback_data: 'trade_open_paradex' },
                  { text: 'HyperLiquid', callback_data: 'trade_open_hyperliquid' }
                ],
                [{ text: '« Назад', callback_data: 'back_to_main_menu' }]
              ]
            }
          }
        );
      }
      else if (data === 'trade_menu_close') {
        await bot.editMessageText(
          'Выберите биржу для закрытия позиции:',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Paradex', callback_data: 'trade_close_paradex' },
                  { text: 'HyperLiquid', callback_data: 'trade_close_hyperliquid' }
                ],
                [{ text: '« Назад', callback_data: 'back_to_main_menu' }]
              ]
            }
          }
        );
      }
      else if (data === 'trade_menu_positions') {
        await bot.editMessageText(
          'Выберите биржу для просмотра позиций:',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Paradex', callback_data: 'trade_positions_paradex' },
                  { text: 'HyperLiquid', callback_data: 'trade_positions_hyperliquid' }
                ],
                [{ text: '« Назад', callback_data: 'back_to_main_menu' }]
              ]
            }
          }
        );
      }
      
      // Обработка открытия позиции на Paradex
      else if (data === 'trade_open_paradex') {
        userTradingStates.set(userId, { exchange: 'Paradex', action: 'open' });
        
        await bot.editMessageText(
          'Введите параметры в формате: СИМВОЛ НАПРАВЛЕНИЕ РАЗМЕР [ЦЕНА]\n\n' +
          'Например: BTC-USD-PERP buy 0.01\n' +
          'Или с ценой: BTC-USD-PERP buy 0.01 50000',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отмена', callback_data: 'trade_cancel' }]
              ]
            }
          }
        );
      }
      
      // Обработка открытия позиции на HyperLiquid
      else if (data === 'trade_open_hyperliquid') {
        userTradingStates.set(userId, { exchange: 'HyperLiquid', action: 'open' });
        
        await bot.editMessageText(
          'Введите параметры в формате: СИМВОЛ НАПРАВЛЕНИЕ РАЗМЕР [ЦЕНА]\n\n' +
          'Например: BTC buy 0.01\n' +
          'Или с ценой: BTC buy 0.01 50000',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отмена', callback_data: 'trade_cancel' }]
              ]
            }
          }
        );
      }
      
      // Обработка закрытия позиции на Paradex
      else if (data === 'trade_close_paradex') {
        userTradingStates.set(userId, { exchange: 'Paradex', action: 'close' });
        
        await bot.editMessageText(
          'Введите символ позиции для закрытия (например: BTC-USD-PERP)',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отмена', callback_data: 'trade_cancel' }]
              ]
            }
          }
        );
      }
      
      // Обработка закрытия позиции на HyperLiquid
      else if (data === 'trade_close_hyperliquid') {
        userTradingStates.set(userId, { exchange: 'HyperLiquid', action: 'close' });
        
        await bot.editMessageText(
          'Введите символ позиции для закрытия (например: BTC)',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отмена', callback_data: 'trade_cancel' }]
              ]
            }
          }
        );
      }
      
      // Обработка просмотра позиций на Paradex
      else if (data === 'trade_positions_paradex') {
        try {
          // Получить список всех позиций с Paradex
          const positions = await paradexTradingService.getAllPositions(userId);
          
          if (!positions || positions.length === 0) {
            await bot.editMessageText(
              'У вас нет открытых позиций на Paradex',
              {
                chat_id: userId,
                message_id: messageId,
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '« Назад', callback_data: 'trade_menu_positions' }]
                  ]
                }
              }
            );
          } else {
            let message = '📊 *Ваши позиции на Paradex:*\n\n';
            
            for (const pos of positions) {
              message += `*${pos.market}*: ${pos.side} ${pos.size} @ ${pos.avgEntryPrice} (PnL: ${pos.unrealizedPnl})\n`;
            }
            
            await bot.editMessageText(message, {
              chat_id: userId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '« Назад', callback_data: 'trade_menu_positions' }]
                ]
              }
            });
          }
        } catch (error) {
          console.error('Ошибка при получении позиций с Paradex:', error);
          await bot.editMessageText(
            'Ошибка при получении позиций. Пожалуйста, проверьте API ключи или попробуйте позже.',
            {
              chat_id: userId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '« Назад', callback_data: 'trade_menu_positions' }]
                ]
              }
            }
          );
        }
      }
      
      // Обработка просмотра позиций на HyperLiquid
      else if (data === 'trade_positions_hyperliquid') {
        try {
          // Получить список всех позиций с HyperLiquid
          const positions = await hyperliquidTradingService.getAllPositions(userId);
          
          if (!positions || positions.length === 0) {
            await bot.editMessageText(
              'У вас нет открытых позиций на HyperLiquid',
              {
                chat_id: userId,
                message_id: messageId,
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '« Назад', callback_data: 'trade_menu_positions' }]
                  ]
                }
              }
            );
          } else {
            let message = '📊 *Ваши позиции на HyperLiquid:*\n\n';
            
            for (const pos of positions) {
              message += `*${pos.coin}*: ${pos.side} ${pos.size} @ ${pos.entryPrice} (PnL: ${pos.pnl})\n`;
            }
            
            await bot.editMessageText(message, {
              chat_id: userId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '« Назад', callback_data: 'trade_menu_positions' }]
                ]
              }
            });
          }
        } catch (error) {
          console.error('Ошибка при получении позиций с HyperLiquid:', error);
          await bot.editMessageText(
            'Ошибка при получении позиций. Пожалуйста, проверьте API ключи или попробуйте позже.',
            {
              chat_id: userId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '« Назад', callback_data: 'trade_menu_positions' }]
                ]
              }
            }
          );
        }
      }
      
      // Отмена операции
      else if (data === 'trade_cancel') {
        userTradingStates.delete(userId);
        
        await bot.editMessageText(
          'Операция отменена.',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Назад', callback_data: 'back_to_main_menu' }]
              ]
            }
          }
        );
      }
      
      await bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Ошибка при обработке торговых запросов:', error);
      await bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка. Попробуйте позже.' });
    }
  });

  // Обработчик текстовых сообщений для выполнения торговых операций
  bot.on('message', async (msg) => {
    // Если сообщение не текстовое или у пользователя нет активного состояния, игнорируем
    if (!msg.text || !userTradingStates.has(msg.from.id)) {
      return;
    }
    
    const userId = msg.from.id;
    const state = userTradingStates.get(userId);
    
    try {
      // Обработка открытия позиции
      if (state.action === 'open') {
        // Парсим параметры
        const params = msg.text.split(' ');
        
        if (params.length < 3) {
          await bot.sendMessage(
            userId,
            'Неверный формат. Пожалуйста, укажите СИМВОЛ НАПРАВЛЕНИЕ РАЗМЕР [ЦЕНА]'
          );
          return;
        }
        
        const market = params[0];
        const side = params[1].toLowerCase();
        const size = parseFloat(params[2]);
        const price = params.length > 3 ? parseFloat(params[3]) : null;
        
        if (isNaN(size) || (price !== null && isNaN(price))) {
          await bot.sendMessage(
            userId,
            'Ошибка: размер и цена должны быть числами.'
          );
          return;
        }
        
        if (side !== 'buy' && side !== 'sell') {
          await bot.sendMessage(
            userId,
            'Ошибка: направление должно быть buy или sell.'
          );
          return;
        }
        
        let result;
        
        if (state.exchange === 'Paradex') {
          result = await paradexTradingService.openPosition(userId, market, side, size, price);
        } else if (state.exchange === 'HyperLiquid') {
          result = await hyperliquidTradingService.openPosition(userId, market, side, size, price);
        }
        
        await bot.sendMessage(
          userId,
          `✅ Ордер успешно размещен на ${state.exchange}!\n\nID: ${result.id || result.orderId}\nСтатус: ${result.status || 'pending'}`
        );
        
        // Очищаем состояние пользователя
        userTradingStates.delete(userId);
      }
      
      // Обработка закрытия позиции
      else if (state.action === 'close') {
        const symbol = msg.text.trim();
        
        let result;
        
        if (state.exchange === 'Paradex') {
          result = await paradexTradingService.closePosition(userId, symbol);
        } else if (state.exchange === 'HyperLiquid') {
          result = await hyperliquidTradingService.closePosition(userId, symbol);
        }
        
        await bot.sendMessage(
          userId,
          `✅ Позиция успешно закрыта на ${state.exchange}!\n\nID: ${result.id || result.orderId}\nСтатус: ${result.status || 'pending'}`
        );
        
        // Очищаем состояние пользователя
        userTradingStates.delete(userId);
      }
    } catch (error) {
      console.error('Ошибка при выполнении торговой операции:', error);
      
      let errorMessage = 'Произошла ошибка при выполнении операции. ';
      
      if (error.response && error.response.data) {
        errorMessage += `Ответ биржи: ${JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += error.message;
      }
      
      await bot.sendMessage(userId, errorMessage);
      userTradingStates.delete(userId);
    }
  });

  return {
    // Экспортируем методы, которые могут понадобиться другим модулям
    userTradingStates
  };
};