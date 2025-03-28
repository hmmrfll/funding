// handlers/startHandler.js
const axios = require('axios');
const db = require('../../config/db');
const { encryptData } = require('../../hooks/useEncryption');

/**
 * Обработчик команды /start
 * @param {object} bot - Экземпляр бота
 * @param {Map} authCodes - Хранилище токенов
 * @param {function} cleanExpiredTokens - Функция очистки токенов
 */
module.exports = function createStartHandler(bot, authCodes, cleanExpiredTokens) {
  return async (msg, match) => {
    try {
      const userId = msg.from.id;
      const username = msg.from.username;
      const firstName = msg.from.first_name;
      const lastName = msg.from.last_name;
      const args = match[1]; // Аргументы после /start
      
      // Проверяем пользователя в базе данных
      const userCheckQuery = `SELECT * FROM users WHERE telegram_id = $1`;
      const userResult = await db.query(userCheckQuery, [userId]);
      
      // Если пользователя нет, добавляем его
      if (userResult.rows.length === 0) {
        console.log(`Создание нового пользователя с Telegram ID: ${userId}`);
        
        const insertQuery = `
          INSERT INTO users (telegram_id, username, first_name, last_name, role, auth_date) 
          VALUES ($1, $2, $3, $4, 'user', NOW()) 
          RETURNING *
        `;
        
        await db.query(insertQuery, [
          userId, 
          username || '', 
          firstName || '', 
          lastName || ''
        ]);
      } else {
        // Обновляем информацию о существующем пользователе
        const updateQuery = `
          UPDATE users 
          SET username = COALESCE($1, username),
              first_name = COALESCE($2, first_name),
              last_name = COALESCE($3, last_name),
              auth_date = NOW()
          WHERE telegram_id = $4
        `;
        
        await db.query(updateQuery, [
          username, 
          firstName, 
          lastName, 
          userId
        ]);
      }
      
      // Проверяем, содержит ли команда аргумент auth
      if (args && args.startsWith('auth_')) {
        try {
          // Создаем временный код авторизации
          const timestamp = Math.floor(Date.now() / 1000);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

          const token = encryptData(userId, timestamp);
          
          // Сохраняем токен с временем жизни в 1 час
          authCodes.set(userId.toString(), {
            token,
            expires: timestamp + 3600 // 60 минут = 3600 секунд
          });
          
          // Формируем URL для авторизации
          const authUrl = `${frontendUrl}?user_id=${userId}&token=${token}`;
          
          // Отправляем кнопку для авторизации
          const opts = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔐 Войти в систему', url: authUrl }]
              ]
            }
          };
          
          await bot.sendMessage(
            userId,
            `Привет, ${firstName}! Для входа в Funding Arbitrage, нажмите на кнопку ниже. Токен действителен 1 час.`,
            opts
          );
          
          // Чистим старые токены
          cleanExpiredTokens();
        } catch (error) {
          console.error('Ошибка при обработке авторизации:', error);
          await bot.sendMessage(
            userId,
            'Произошла ошибка при обработке авторизации. Пожалуйста, попробуйте позже.'
          );
        }
      } else {
        // Стандартное приветствие с кнопками для посещения сайта и управления API ключами
        const siteUrl = process.env.FRONTEND_URL || 'https://paradex.hedgie.org';
        
        const opts = {
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
        };
        
        await bot.sendMessage(
          userId,
          `Привет, ${firstName}! Я бот для авторизации в системе фандинг-арбитража.\n\n` +
          `🔍 Чтобы войти в систему, перейдите на сайт и нажмите кнопку "Войти через Telegram".\n\n` +
          `🔑 Для управления API ключами используйте соответствующую кнопку.`,
          opts
        );
      }
    } catch (error) {
      console.error('Ошибка при обработке команды /start:', error);
      
      // Отправляем уведомление об ошибке пользователю
      if (msg && msg.from && msg.from.id) {
        bot.sendMessage(
          msg.from.id, 
          'Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.'
        );
      }
    }
  };
};