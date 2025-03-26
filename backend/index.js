// index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const db = require('./config/db');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const scheduler = require('./utils/scheduler');
const telegramBot = require('./bot/telegramBot'); // Импортируем бота

// Инициализация приложения
const app = express();

// Middleware
app.use(cors({
  origin: '*',  // или конкретные домены
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev')); // Логирование HTTP запросов

// Маршруты
app.use('/api', apiRoutes);

// Обработчик ошибок
app.use(errorHandler);

// Запуск планировщика задач
scheduler.init();

// Запуск Telegram бота с вебхуком
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_URL) {
  const bot = telegramBot.startBot();
  
  if (bot) {
    console.log('Telegram бот запущен в режиме вебхука');
  } else {
    console.warn('Не удалось запустить Telegram бота');
  }
} else {
  console.warn('TELEGRAM_BOT_TOKEN или TELEGRAM_WEBHOOK_URL не установлены. Telegram бот не запущен.');
}

// Запуск сервера
const PORT = config.app.port;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Режим: ${config.app.env}`);
});

// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
  console.error('Необработанное исключение:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Необработанный rejection:', err);
  process.exit(1);
});

// Обработка завершения работы
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT, завершаем работу...');
  telegramBot.stopBot();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM, завершаем работу...');
  telegramBot.stopBot();
  process.exit(0);
});

// Экспортируем приложение для тестирования
module.exports = app;