// utils/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
const express = require('express');
const createStartHandler = require('./handlers/startHandler');

// Временное хранилище токенов авторизации
const authCodes = new Map();

// Создаем экземпляр бота
let bot;
let webhookServer;

/**
 * Инициализация бота в режиме вебхука
 */
function startBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN не установлен. Бот не запущен.');
      return;
    }
    
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('TELEGRAM_WEBHOOK_URL не установлен. Невозможно настроить вебхук.');
      return;
    }
    
    const port = process.env.TELEGRAM_WEBHOOK_PORT || 8443;
    
    // Создаем экземпляр бота в режиме вебхука
    bot = new TelegramBot(token, {
      webHook: {
        port: port
      }
    });
    
    // Устанавливаем вебхук
    bot.setWebHook(`${webhookUrl}/bot${token}`);
    
    console.log(`Telegram бот запущен в режиме вебхука на порту ${port}`);
    console.log(`Webhook URL: ${webhookUrl}/bot${token}`);
    
    // Настраиваем обработчики команд
    setupEventHandlers();
    
    return bot;
  } catch (error) {
    console.error('Ошибка при запуске Telegram бота:', error);
  }
}

/**
 * Настройка обработчиков команд бота
 */
function setupEventHandlers() {
  // Подключаем обработчик команды /start из отдельного модуля
  const startHandler = createStartHandler(bot, authCodes, cleanExpiredTokens);
  bot.onText(/\/start(?:\s+(.+))?/, startHandler);
  
  // Обработчик всех сообщений
  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      bot.sendMessage(msg.from.id, 'Я понимаю только команды. Для списка доступных команд, отправьте /help');
    }
  });
}

/**
 * Функция для очистки устаревших токенов
 */
function cleanExpiredTokens() {
  const now = Math.floor(Date.now() / 1000);
  for (const [userId, authInfo] of authCodes.entries()) {
    if (now > authInfo.expires) {
      authCodes.delete(userId);
    }
  }
}

/**
 * Проверка валидности токена
 */
async function verifyToken(userId, token) {
  const authInfo = authCodes.get(userId.toString());
  if (!authInfo || authInfo.token !== token) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return now < authInfo.expires;
}

/**
 * Остановка бота
 */
function stopBot() {
  if (bot) {
    bot.close();
    console.log('Telegram бот остановлен');
  }
}

module.exports = {
  startBot,
  stopBot,
  verifyToken,
  bot
};