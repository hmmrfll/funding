// services/paradexService.js
const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
// Заменяем импорт arbitrageService на assetService
const assetService = require('./assetService');

class ParadexService {
  constructor() {
    this.baseUrl = config.api.paradex.baseUrl;
  }

  async getMarkets() {
    try {
      console.log(`Запрос к Paradex API: ${this.baseUrl}/markets`);
      const response = await axios.get(`${this.baseUrl}/markets`);
      
      if (!response.data || !response.data.results) {
        console.error('Неожиданный формат ответа от Paradex API markets');
        return [];
      }
      
      return response.data.results;
    } catch (error) {
      this.handleApiError(error, 'получении данных о рынках с Paradex');
      return [];
    }
  }

  async getFundingData(market) {
    try {
      console.log(`Запрос к Paradex API: ${this.baseUrl}/funding/data?market=${market}`);
      const response = await axios.get(`${this.baseUrl}/funding/data`, {
        params: { market }
      });
      
      if (!response.data || !response.data.results) {
        console.error('Неожиданный формат ответа от Paradex API funding/data');
        return [];
      }
      
      return response.data.results;
    } catch (error) {
      this.handleApiError(error, `получении данных о фандинге для ${market} с Paradex`);
      return [];
    }
  }

  async saveMarketData(marketData) {
    try {
      // Извлекаем символ из названия рынка (например, "BTC-USD-PERP" -> "BTC")
      const symbol = marketData.base_currency;
      
      // Получаем или создаем актив, используя assetService вместо arbitrageService
      const assetId = await assetService.getAssetOrCreateBySymbol(symbol);
      
      // Сохраняем метаданные рынка
      await db.query(
        `INSERT INTO paradex_asset_metadata 
         (asset_id, market, base_currency, quote_currency, settlement_currency, funding_period_hours, max_funding_rate, interest_rate, clamp_rate, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (asset_id, market) DO UPDATE SET 
           base_currency = $3,
           quote_currency = $4,
           settlement_currency = $5,
           funding_period_hours = $6,
           max_funding_rate = $7,
           interest_rate = $8,
           clamp_rate = $9,
           updated_at = NOW()`,
        [
          assetId,
          marketData.symbol,
          marketData.base_currency,
          marketData.quote_currency,
          marketData.settlement_currency,
          marketData.funding_period_hours,
          marketData.max_funding_rate,
          marketData.interest_rate,
          marketData.clamp_rate
        ]
      );
      
      return { assetId, symbol: marketData.base_currency };
    } catch (error) {
      console.error('Ошибка при сохранении метаданных рынка Paradex:', error);
      throw error;
    }
  }

  async saveFundingData(fundingData, assetId) {
    try {
      // Проверяем, что у нас есть данные
      if (!fundingData || fundingData.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      for (const data of fundingData) {
        try {
          await db.query(
            `INSERT INTO paradex_funding_rates 
             (asset_id, market, funding_rate, funding_premium, funding_index, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (asset_id, market, created_at) DO NOTHING`,
            [
              assetId,
              data.market,
              data.funding_rate,
              data.funding_premium,
              data.funding_index,
              data.created_at
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error('Ошибка при сохранении данных о фандинге Paradex:', innerError);
          // Продолжаем с следующей записью
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге Paradex:', error);
      throw error;
    }
  }

  // Добавить в класс ParadexService метод для сохранения данных рынков:
  // paradexService.js
  async saveMarketsData(marketsData) {
    try {
      console.log(`Сохранение данных ${marketsData.length} рынков Paradex`);
      const result = await db.query(
        `INSERT INTO external_data (source, content) VALUES ($1, $2) RETURNING id`,
        ['paradex_markets', JSON.stringify(marketsData)]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error('Ошибка при сохранении данных рынков Paradex:', error);
      throw error;
    }
  }

  // В файле paradexService.js добавьте метод для получения данных рыночной статистики
async getMarketsSummary() {
  try {
    console.log(`Запрос к Paradex API: ${this.baseUrl}/markets/summary?market=ALL`);
    const response = await axios.get(`${this.baseUrl}/markets/summary`, {
      params: { market: 'ALL' }
    });
    
    if (!response.data || !response.data.results) {
      console.error('Неожиданный формат ответа от Paradex API markets/summary');
      return [];
    }
    
    return response.data.results;
  } catch (error) {
    this.handleApiError(error, 'получении данных о статистике рынков с Paradex');
    return [];
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

module.exports = new ParadexService();