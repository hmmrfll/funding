// services/binanceService.js
const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
const assetService = require('./assetService');

class BinanceService {
  constructor() {
    this.baseUrl = config.api.binance.baseUrl; // Нужно добавить в config
  }

  async getFundingRates(symbol = null, limit = 100) {
    try {

      const params = { limit };
      if (symbol) params.symbol = symbol;
      
      const response = await axios.get(`${this.baseUrl}/fapi/v1/fundingRate`, { params });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Неожиданный формат ответа от Binance API fundingRate');
        return [];
      }
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'получении ставок фандинга с Binance');
      return [];
    }
  }

  async getFundingInfo() {
    try {

      const response = await axios.get(`${this.baseUrl}/fapi/v1/fundingInfo`);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Неожиданный формат ответа от Binance API fundingInfo');
        return [];
      }
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'получении информации о фандинге с Binance');
      return [];
    }
  }

  async saveFundingData(fundingRates) {
    try {
      if (!fundingRates || fundingRates.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      for (const data of fundingRates) {
        try {
          // Извлекаем базовый символ из пары (например, из BTCUSDT получаем BTC)
          const baseSymbol = data.symbol.replace(/USDT$|USD$|BUSD$/, '');
          
          // Получаем или создаем актив
          const assetId = await assetService.getAssetOrCreateBySymbol(baseSymbol);
          
          // Сохраняем данные о фандинге
          await db.query(
            `INSERT INTO binance_funding_rates 
             (asset_id, symbol, funding_rate, funding_time, mark_price, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (asset_id, symbol, funding_time) DO NOTHING`,
            [
              assetId,
              data.symbol,
              data.fundingRate,
              data.fundingTime,
              data.markPrice || null,
              Date.now() // текущее время в миллисекундах
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении данных о фандинге для ${data.symbol} Binance:`, innerError);
          // Продолжаем с следующей записью
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге Binance:', error);
      throw error;
    }
  }

  async saveFundingInfo(fundingInfo) {
    try {
      if (!fundingInfo || fundingInfo.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      for (const info of fundingInfo) {
        try {
          // Извлекаем базовый символ из пары
          const baseSymbol = info.symbol.replace(/USDT$|USD$|BUSD$/, '');
          
          // Получаем или создаем актив
          const assetId = await assetService.getAssetOrCreateBySymbol(baseSymbol);
          
          // Сохраняем метаданные
          await db.query(
            `INSERT INTO binance_asset_metadata 
             (asset_id, symbol, adjusted_funding_rate_cap, adjusted_funding_rate_floor, funding_interval_hours, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (asset_id, symbol) DO UPDATE SET 
               adjusted_funding_rate_cap = $3,
               adjusted_funding_rate_floor = $4,
               funding_interval_hours = $5,
               updated_at = NOW()`,
            [
              assetId,
              info.symbol,
              info.adjustedFundingRateCap,
              info.adjustedFundingRateFloor,
              info.fundingIntervalHours
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении метаданных для ${info.symbol} Binance:`, innerError);
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении метаданных Binance:', error);
      throw error;
    }
  }

  handleApiError(error, context) {
    console.error(`Ошибка при ${context}:`, error);
    
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
      console.error('Статус:', error.response.status);
    } else if (error.request) {
      console.error('Запрос был отправлен, но ответ не получен:', error.request);
    } else {
      console.error('Ошибка при настройке запроса:', error.message);
    }
  }
}

module.exports = new BinanceService();