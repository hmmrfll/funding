// services/paradexTradingService.js
const db = require('../config/db');
const { decryptApiKey } = require('../bot/handlers/apiKeys/crypto');

class ParadexTradingService {
  constructor() {
    // Конструктор без baseUrl, SDK сам это обрабатывает
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
      
      const { api_key } = result.rows[0];
      
      return {
        jwt: decryptApiKey(api_key), // JWT токен хранится в поле api_key
      };
    } catch (error) {
      console.error('Ошибка при получении JWT токена:', error);
      throw error;
    }
  }

  async getClient(userId) {
    try {
      const credentials = await this.getApiCredentials(userId);
      
      // Динамический импорт ES модуля
      const { ParadexClient } = await import('@paradex/sdk');
      
      // Создаем клиент с использованием SDK и JWT токена
      return new ParadexClient({
        jwt: credentials.jwt, 
        // Можно добавить дополнительные опции, если необходимо
      });
    } catch (error) {
      console.error('Ошибка при создании клиента Paradex:', error);
      throw error;
    }
  }

  async openPosition(userId, market, side, size, price = null, reduceOnly = false) {
    try {
      const client = await this.getClient(userId);
      
      // Формируем параметры ордера в соответствии с API Paradex
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
      
      // Создаем ордер через SDK
      const order = await client.createOrder(orderParams);
      
      return order;
    } catch (error) {
      console.error('Ошибка при открытии позиции на Paradex:', error);
      throw error;
    }
  }

  async closePosition(userId, market, size = null) {
    try {
      const client = await this.getClient(userId);
      
      // Если размер не указан, закрываем всю позицию
      if (!size) {
        const position = await this.getPosition(userId, market);
        if (!position || position.size === 0) {
          throw new Error('Нет открытой позиции для закрытия');
        }
        
        // Определяем противоположную сторону
        const side = position.size > 0 ? 'SELL' : 'BUY';
        size = Math.abs(position.size);
        
        // Создаем ордер для закрытия позиции
        return await client.createOrder({
          market,
          side,
          size: size.toString(),
          orderType: 'MARKET',
          reduceOnly: true
        });
      } else {
        // Если размер указан, нужно определить направление позиции
        const position = await this.getPosition(userId, market);
        if (!position || position.size === 0) {
          throw new Error('Нет открытой позиции для закрытия');
        }
        
        const side = position.size > 0 ? 'SELL' : 'BUY';
        
        // Создаем ордер для частичного закрытия позиции
        return await client.createOrder({
          market,
          side,
          size: size.toString(),
          orderType: 'MARKET',
          reduceOnly: true
        });
      }
    } catch (error) {
      console.error('Ошибка при закрытии позиции на Paradex:', error);
      throw error;
    }
  }

  async getPosition(userId, market) {
    try {
      const client = await this.getClient(userId);
      
      // Получаем позиции через SDK
      const positions = await client.getPositions();
      
      // Находим позицию для указанного рынка
      return positions.find(pos => pos.market === market) || null;
    } catch (error) {
      console.error('Ошибка при получении позиции с Paradex:', error);
      throw error;
    }
  }

  async getAllPositions(userId) {
    try {
      const client = await this.getClient(userId);
      
      // Получаем все позиции через SDK
      return await client.getPositions();
    } catch (error) {
      console.error('Ошибка при получении позиций с Paradex:', error);
      throw error;
    }
  }
}

module.exports = new ParadexTradingService();