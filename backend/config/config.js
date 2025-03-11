// config/config.js
require('dotenv').config(); // Для загрузки переменных окружения из .env файла

module.exports = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  db: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'funding_arbitrage',
  },
  api: {
    paradex: {
      baseUrl: process.env.PARADEX_API_URL || 'https://api.prod.paradex.trade/v1', // Исправлен URL
      // Другие настройки API Paradex
    },
    hyperliquid: {
      baseUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz/info',
      // Другие настройки API HyperLiquid
    },
  },
  scheduler: {
    interval: process.env.SCHEDULER_INTERVAL || '*/5 * * * *', // Каждые 5 минут по умолчанию
  },
  // Список основных активов для обработки
  topAssets: [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
    'AVAX', 'DOGE', 'ADA', 'LINK', 'DOT'
  ],
  // Настройки ограничения запросов к API
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS) || 20,  // количество запросов
    period: parseInt(process.env.RATE_LIMIT_PERIOD) || 60000    // период в миллисекундах (1 минута)
  },
  // Время кэширования данных (в миллисекундах)
  cacheTTL: parseInt(process.env.CACHE_TTL) || 5 * 60 * 1000  // 5 минут по умолчанию
};