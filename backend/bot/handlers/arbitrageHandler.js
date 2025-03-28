// bot/handlers/arbitrageHandler.js
const fundingArbitrageService = require('../../services/fundingArbitrageService');

module.exports = function createArbitrageHandler(bot) {
  // Состояния пользователей для хранения данных арбитража
  const userArbitrageStates = new Map();
  
  // Если глобальные хранилища для данных арбитража не существуют, создаем их
  if (!global.arbitrageOpportunities) {
    global.arbitrageOpportunities = [];
  }
  if (!global.arbitrageStrategies) {
    global.arbitrageStrategies = {};
  }
  
  // Обработчик callback_query для кнопок
  bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const data = query.data;
    
    // Пропускаем обработку, если это не арбитражные операции
    if (!data.startsWith('arbitrage_') && data !== 'back_to_main_menu') {
      return;
    }
    
    try {
      // Обработка кнопки арбитражного меню
      if (data === 'arbitrage_menu') {
        // Получаем и показываем арбитражные возможности
        const opportunities = await fundingArbitrageService.getArbitrageOpportunities(0.0005);
        
        if (opportunities.length === 0) {
          await bot.editMessageText(
            'В данный момент нет доступных арбитражных возможностей с разницей ставок более 0.05%',
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
          return;
        }
        
        let message = '🔄 *Арбитражные возможности фандинга:*\n\n';
        
        // Показываем топ-5 возможностей
        for (let i = 0; i < Math.min(5, opportunities.length); i++) {
          const opp = opportunities[i];
          const annualReturn = (Math.abs(opp.annualized_return) * 100).toFixed(2);
          
          message += `*${i+1}. ${opp.symbol}*\n`;
          message += `${opp.exchange1}: ${(opp.rate1 * 100).toFixed(4)}% vs ${opp.exchange2}: ${(opp.rate2 * 100).toFixed(4)}%\n`;
          message += `Разница: ${(Math.abs(opp.rate_difference) * 100).toFixed(4)}%\n`;
          message += `Годовая доходность: ~${annualReturn}%\n`;
          message += `Стратегия: ${opp.recommended_strategy}\n\n`;
        }
        
        // Добавляем кнопки для выполнения операций
        const inlineKeyboard = opportunities.slice(0, 5).map((opp, i) => {
          return [
            { 
              text: `Арбитраж ${opp.symbol}`, 
              callback_data: `arbitrage_execute_${i}` 
            }
          ];
        });
        
        // Добавляем данные о возможностях в глобальный объект
        global.arbitrageOpportunities = opportunities;
        
        await bot.editMessageText(message, {
          chat_id: userId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              ...inlineKeyboard,
              [{ text: '« Назад', callback_data: 'back_to_main_menu' }]
            ]
          }
        });
      }
      
      // Обработка нажатия кнопки арбитража
      else if (data.startsWith('arbitrage_execute_')) {
        const index = parseInt(data.replace('arbitrage_execute_', ''));
        
        if (!global.arbitrageOpportunities || index >= global.arbitrageOpportunities.length) {
          await bot.answerCallbackQuery(query.id, {
            text: 'Информация устарела. Пожалуйста, обновите список возможностей.'
          });
          return;
        }
        
        const opportunity = global.arbitrageOpportunities[index];
        
        // Запрашиваем размер позиции
        userArbitrageStates.set(userId, { opportunity });
        
        await bot.editMessageText(
          `*Арбитраж ${opportunity.symbol}*\n\n` +
          `${opportunity.exchange1}: ${(opportunity.rate1 * 100).toFixed(4)}% vs ${opportunity.exchange2}: ${(opportunity.rate2 * 100).toFixed(4)}%\n` +
          `Разница: ${(Math.abs(opportunity.rate_difference) * 100).toFixed(4)}%\n\n` +
          `Укажите размер позиции (в BTC или другой базовой валюте):`,
          {
            chat_id: userId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отмена', callback_data: 'arbitrage_cancel' }]
              ]
            }
          }
        );
      }
      
      // Отмена операции арбитража
      else if (data === 'arbitrage_cancel') {
        userArbitrageStates.delete(userId);
        
        await bot.editMessageText(
          'Операция арбитража отменена.',
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Назад', callback_data: 'arbitrage_menu' }]
              ]
            }
          }
        );
      }
      
      // Кнопка закрытия арбитражной позиции
      else if (data.startsWith('arbitrage_close_')) {
        const strategyId = data.replace('arbitrage_close_', '');
        
        // Получаем информацию о стратегии из глобального объекта
        if (!global.arbitrageStrategies || !global.arbitrageStrategies[strategyId]) {
          await bot.answerCallbackQuery(query.id, {
            text: 'Информация о стратегии устарела или не найдена.'
          });
          return;
          // bot/handlers/arbitrageHandler.js (продолжение)

        }
        
        const strategy = global.arbitrageStrategies[strategyId];
        
        await bot.editMessageText(
          `Закрытие арбитражной позиции ${strategy.long.symbol}...\n\nПожалуйста, подождите.`,
          {
            chat_id: userId,
            message_id: messageId
          }
        );
        
        // Закрываем позиции
        const result = await fundingArbitrageService.closeArbitragePositions(userId, strategy);
        
        await bot.editMessageText(
          `✅ Арбитражные позиции для ${strategy.long.symbol} успешно закрыты!\n\n` +
          `Long на ${strategy.long.exchange}: ${result.long.result.status || 'success'}\n` +
          `Short на ${strategy.short.exchange}: ${result.short.result.status || 'success'}`,
          {
            chat_id: userId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Назад к арбитражу', callback_data: 'arbitrage_menu' }]
              ]
            }
          }
        );
        
        // Удаляем стратегию из глобального объекта
        delete global.arbitrageStrategies[strategyId];
      }
      
      // Обработка возврата в главное меню
      else if (data === 'back_to_main_menu') {
        const siteUrl = process.env.FRONTEND_URL || 'https://paradex.hedgie.org';
        
        await bot.editMessageText(
          `Привет, ${query.from.first_name}! Я бот для арбитража фандинга и управления позициями.\n\n` +
          `🔍 Чтобы войти в систему, перейдите на сайт и нажмите кнопку "Войти через Telegram".\n\n` +
          `🔑 Используйте меню для управления API ключами и торговыми операциями.`,
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
                ],
                [
                  { text: '📈 Открыть позицию', callback_data: 'trade_menu_open' },
                  { text: '📉 Закрыть позицию', callback_data: 'trade_menu_close' }
                ],
                [
                  { text: '📊 Мои позиции', callback_data: 'trade_menu_positions' },
                  { text: '🔄 Арбитраж фандинга', callback_data: 'arbitrage_menu' }
                ]
              ]
            }
          }
        );
      }
      
      await bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Ошибка при обработке запросов арбитража:', error);
      await bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка. Попробуйте позже.' });
    }
  });

  // Обработчик текстовых сообщений для арбитража
  bot.on('message', async (msg) => {
    // Если сообщение не текстовое или у пользователя нет активного состояния арбитража, игнорируем
    if (!msg.text || !userArbitrageStates.has(msg.from.id)) {
      return;
    }
    
    const userId = msg.from.id;
    const state = userArbitrageStates.get(userId);
    
    try {
      // Парсим размер позиции
      const size = parseFloat(msg.text.trim());
      
      if (isNaN(size) || size <= 0) {
        await bot.sendMessage(
          userId,
          'Размер позиции должен быть положительным числом.'
        );
        return;
      }
      
      await bot.sendMessage(
        userId,
        `Исполнение арбитражной стратегии для ${state.opportunity.symbol}...\n\nПожалуйста, подождите.`
      );
      
      // Исполняем арбитражную стратегию
      const result = await fundingArbitrageService.executeArbitrageStrategy(
        userId, 
        state.opportunity, 
        size
      );
      
      // Сохраняем стратегию в глобальном объекте для возможности закрытия позиций
      if (!global.arbitrageStrategies) {
        global.arbitrageStrategies = {};
      }
      
      const strategyId = Date.now().toString();
      global.arbitrageStrategies[strategyId] = result;
      
      // Отправляем сообщение об успешном исполнении
      await bot.sendMessage(
        userId,
        `✅ Арбитражная стратегия для ${state.opportunity.symbol} успешно исполнена!\n\n` +
        `Long на ${result.long.exchange}: ${result.long.symbol} (${result.long.result.status || 'success'})\n` +
        `Short на ${result.short.exchange}: ${result.short.symbol} (${result.short.result.status || 'success'})\n\n` +
        `Ожидаемая годовая доходность: ~${(Math.abs(state.opportunity.annualized_return) * 100).toFixed(2)}%`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Закрыть позиции', callback_data: `arbitrage_close_${strategyId}` }]
            ]
          }
        }
      );
      
      // Очищаем состояние пользователя
      userArbitrageStates.delete(userId);
    } catch (error) {
      console.error('Ошибка при исполнении арбитражной стратегии:', error);
      
      let errorMessage = 'Произошла ошибка при исполнении арбитражной стратегии. ';
      
      if (error.response && error.response.data) {
        errorMessage += `Ответ биржи: ${JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += error.message;
      }
      
      await bot.sendMessage(userId, errorMessage);
      userArbitrageStates.delete(userId);
    }
  });

  return {
    // Экспортируем методы, которые могут понадобиться другим модулям
    userArbitrageStates
  };
};