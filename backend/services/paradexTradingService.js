// services/paradexTradingService.js
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const db = require('../config/db');
const { decryptApiKey } = require('../bot/handlers/apiKeys/crypto');

class ParadexTradingService {
  constructor() {
    this.baseUrl = config.api.paradex.baseUrl;
  }

  async getApiCredentials(userId) {
    try {
      const query = `
        SELECT api_key, api_secret, passphrase 
        FROM user_api_keys 
        WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1) 
        AND exchange = 'Paradex' 
        AND is_active = TRUE
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('API ключи для Paradex не найдены');
      }
      
      const { api_key, api_secret, passphrase } = result.rows[0];
      
      return {
        apiKey: decryptApiKey(api_key),
        apiSecret: decryptApiKey(api_secret),
        passphrase: passphrase ? decryptApiKey(passphrase) : null
      };
    } catch (error) {
      console.error('Ошибка при получении API ключей:', error);
      throw error;
    }
  }

  async openPosition(userId, market, side, size, price = null, reduceOnly = false) {
    try {
      const credentials = await this.getApiCredentials(userId);
      
      // Формируем параметры ордера
      const orderParams = {
        market,
        side: side.toUpperCase(), // 'BUY' или 'SELL'
        size: size.toString(),
        orderType: price ? 'LIMIT' : 'MARKET',
        reduceOnly
      };
      
      if (price) {
        orderParams.price = price.toString();
      }
      
      // Текущее время в миллисекундах
      const timestamp = Date.now().toString();
      
      // Формируем строку для подписи
      const path = '/v1/orders';
      const body = JSON.stringify(orderParams);
      const message = timestamp + 'POST' + path + body;
      
      // Создаем подпись с помощью HMAC-SHA256
      const signature = crypto
        .createHmac('sha256', credentials.apiSecret)
        .update(message)
        .digest('hex');
      
      // Выполняем запрос к API
      const response = await axios.post(`${this.baseUrl}/orders`, orderParams, {
        headers: {
          'PARADEX-API-KEY': credentials.apiKey,
          'PARADEX-TIMESTAMP': timestamp,
          'PARADEX-SIGNATURE': signature,
          'PARADEX-PASSPHRASE': credentials.passphrase,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при открытии позиции на Paradex:', error);
      throw error;
    }
  }

  async closePosition(userId, market, size = null) {
    try {
      // Если размер не указан, закрываем всю позицию
      if (!size) {
        const position = await this.getPosition(userId, market);
        if (!position || position.size === 0) {
          throw new Error('Нет открытой позиции для закрытия');
        }
        
        // Определяем противоположную сторону
        const side = position.size > 0 ? 'SELL' : 'BUY';
        size = Math.abs(position.size);
        
        // Закрываем позицию
        return await this.openPosition(userId, market, side, size, null, true);
      } else {
        // Если размер указан, нужно определить направление позиции
        const position = await this.getPosition(userId, market);
        if (!position || position.size === 0) {
          throw new Error('Нет открытой позиции для закрытия');
        }
        
        const side = position.size > 0 ? 'SELL' : 'BUY';
        return await this.openPosition(userId, market, side, size, null, true);
      }
    } catch (error) {
      console.error('Ошибка при закрытии позиции на Paradex:', error);
      throw error;
    }
  }

  async getPosition(userId, market) {
    try {
      const credentials = await this.getApiCredentials(userId);
      
      // Текущее время в миллисекундах
      const timestamp = Date.now().toString();
      
      // Формируем строку для подписи
      const path = `/v1/positions?market=${market}`;
      const message = timestamp + 'GET' + path;
      
      // Создаем подпись с помощью HMAC-SHA256
      const signature = crypto
        .createHmac('sha256', credentials.apiSecret)
        .update(message)
        .digest('hex');
      
      // Выполняем запрос к API
      const response = await axios.get(`${this.baseUrl}/positions`, {
        params: { market },
        headers: {
          'PARADEX-API-KEY': credentials.apiKey,
          'PARADEX-TIMESTAMP': timestamp,
          'PARADEX-SIGNATURE': signature,
          'PARADEX-PASSPHRASE': credentials.passphrase
        }
      });
      
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        return null;
      }
      
      return response.data.results.find(pos => pos.market === market) || null;
    } catch (error) {
      console.error('Ошибка при получении позиции с Paradex:', error);
      throw error;
    }
  }
}

module.exports = new ParadexTradingService();