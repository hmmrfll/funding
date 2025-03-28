// services/hyperliquidTradingService.js
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const db = require('../config/db');
const { decryptApiKey } = require('../bot/handlers/apiKeys/crypto');

class HyperliquidTradingService {
  constructor() {
    this.baseUrl = config.api.hyperliquid.baseUrl;
    this.tradingUrl = 'https://api.hyperliquid.xyz/trade'; // Уточните правильный URL для торговых операций
  }

  async getApiCredentials(userId) {
    try {
      const query = `
        SELECT api_key, api_secret 
        FROM user_api_keys 
        WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1) 
        AND exchange = 'HyperLiquid' 
        AND is_active = TRUE
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('API ключи для HyperLiquid не найдены');
      }
      
      const { api_key, api_secret } = result.rows[0];
      
      return {
        apiKey: decryptApiKey(api_key),
        apiSecret: decryptApiKey(api_secret)
      };
    } catch (error) {
      console.error('Ошибка при получении API ключей:', error);
      throw error;
    }
  }

  async openPosition(userId, coin, side, size, price = null, reduceOnly = false) {
    try {
      const credentials = await this.getApiCredentials(userId);
      
      // Формируем параметры ордера для HyperLiquid
      const orderParams = {
        type: "order",
        action: {
          type: price ? "LIMIT" : "MARKET",
          coin,
          side: side.toUpperCase(), // 'BUY' или 'SELL'
          size: size.toString(),
          reduceOnly
        }
      };
      
      if (price) {
        orderParams.action.limitPrice = price.toString();
      }
      
      // Создаем подпись для запроса (метод зависит от требований API HyperLiquid)
      const signature = this.createSignature(credentials.apiSecret, orderParams);
      
      // Выполняем запрос к API
      const response = await axios.post(this.tradingUrl, orderParams, {
        headers: {
          'HL-API-KEY': credentials.apiKey,
          'HL-SIGNATURE': signature,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при открытии позиции на HyperLiquid:', error);
      throw error;
    }
  }

  async closePosition(userId, coin, size = null) {
    try {
      // Если размер не указан, закрываем всю позицию
      if (!size) {
        const position = await this.getPosition(userId, coin);
        if (!position || position.size === 0) {
          throw new Error('Нет открытой позиции для закрытия');
        }
        
        // Определяем противоположную сторону
        const side = position.size > 0 ? 'SELL' : 'BUY';
        size = Math.abs(position.size);
        
        // Закрываем позицию
        return await this.openPosition(userId, coin, side, size, null, true);
      } else {
        // Если размер указан, нужно определить направление позиции
        const position = await this.getPosition(userId, coin);
        if (!position || position.size === 0) {
          throw new Error('Нет открытой позиции для закрытия');
        }
        
        const side = position.size > 0 ? 'SELL' : 'BUY';
        return await this.openPosition(userId, coin, side, size, null, true);
      }
    } catch (error) {
      console.error('Ошибка при закрытии позиции на HyperLiquid:', error);
      throw error;
    }
  }

  async getPosition(userId, coin) {
    try {
      const credentials = await this.getApiCredentials(userId);
      
      // Запрос для получения позиций
      const requestData = {
        type: "userState"
      };
      
      // Создаем подпись для запроса
      const signature = this.createSignature(credentials.apiSecret, requestData);
      
      // Выполняем запрос к API
      const response = await axios.post(this.baseUrl, requestData, {
        headers: {
          'HL-API-KEY': credentials.apiKey,
          'HL-SIGNATURE': signature,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.assetPositions) {
        return null;
      }
      
      return response.data.assetPositions.find(pos => pos.coin === coin) || null;
    } catch (error) {
      console.error('Ошибка при получении позиции с HyperLiquid:', error);
      throw error;
    }
  }

  createSignature(apiSecret, params) {
    // Реализуйте создание подписи согласно требованиям API HyperLiquid
    const payload = JSON.stringify(params);
    return crypto
      .createHmac('sha256', apiSecret)
      .update(payload)
      .digest('hex');
  }
}

module.exports = new HyperliquidTradingService();