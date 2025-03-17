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
    binance: {
      baseUrl: process.env.BINANCE_API_URL || 'https://fapi.binance.com',
    },

    bybit: {
      baseUrl: process.env.BYBIT_API_URL || 'https://api.bybit.com',
    },
    
    dydx: {
      baseUrl: process.env.DYDX_API_URL || 'https://indexer.dydx.trade/v4',
    },
  },
  scheduler: {
    interval: process.env.SCHEDULER_INTERVAL || '*/5 * * * *', // Каждые 5 минут по умолчанию
  },
  // Список основных активов для обработки
  topAssets: [
    // Основные крупные криптовалюты
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 
    'AVAX', 'DOGE', 'ADA', 'LINK', 'DOT',
    
    // Другие популярные Layer 1 и Layer 2 блокчейны
    'MATIC', 'OP', 'ARB', 'SUI', 'APT',
    'NEAR', 'FTM', 'TRX', 'TON', 'STX',
    'ATOM', 'ICP', 'HBAR', 'TIA', 'INJ',
    
    // DeFi и экосистемные токены
    'UNI', 'AAVE', 'MKR', 'CRV', 'LDO',
    'SNX', 'DYDX', 'SUSHI', 'FXS', 'PENDLE',
    
    // Мемкоины и другие популярные токены
    'PEPE', 'SHIB', 'BONK', 'WIF', 'MEME',
    'STRK', 'IMX', 'RUNE', 'FIL', 'LTC',
    
    // Новые и трендовые токены
    'JUP', 'SEI', 'PYTH', 'TAO', 'MANTA',

    'KAITO', 'IP', 'RED', 'RAY', 'OM', 'ELX'
  ],
  // Настройки ограничения запросов к API
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS) || 20,  // количество запросов
    period: parseInt(process.env.RATE_LIMIT_PERIOD) || 60000    // период в миллисекундах (1 минута)
  },
  // Время кэширования данных (в миллисекундах)
  cacheTTL: parseInt(process.env.CACHE_TTL) || 5 * 60 * 1000  // 5 минут по умолчанию
};