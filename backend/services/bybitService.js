const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
const assetService = require('./assetService');

class BybitService {
  constructor() {
    this.baseUrl = config.api.bybit.baseUrl;
  }

  async getFundingRates(symbol, category = 'linear', limit = 200) {
    try {

      
      const response = await axios.get(`${this.baseUrl}/v5/market/funding/history`, {
        params: { category, symbol, limit }
      });
      
      if (!response.data || !response.data.result || !response.data.result.list) {
        console.error('Неожиданный формат ответа от Bybit API funding/history');
        return [];
      }
      
      return response.data.result.list;
    } catch (error) {
      this.handleApiError(error, `получении ставок фандинга для ${symbol} с Bybit`);
      return [];
    }
  }

  async saveFundingData(fundingData, category, baseSymbol) {
    try {
      if (!fundingData || fundingData.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      // Получаем или создаем актив
      const assetId = await assetService.getAssetOrCreateBySymbol(baseSymbol);
      
      for (const data of fundingData) {
        try {
          await db.query(
            `INSERT INTO bybit_funding_rates 
             (asset_id, symbol, funding_rate, funding_time, category, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (asset_id, symbol, funding_time) DO NOTHING`,
            [
              assetId,
              data.symbol,
              data.fundingRate,
              data.fundingRateTimestamp,
              category,
              Date.now()
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении данных о фандинге для ${data.symbol} Bybit:`, innerError);
        }
      }
      
      // Сохраняем метаданные
      if (fundingData.length > 0) {
        await db.query(
          `INSERT INTO bybit_asset_metadata 
           (asset_id, symbol, category, updated_at) 
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (asset_id, symbol) DO UPDATE SET 
             category = $3,
             updated_at = NOW()`,
          [
            assetId,
            fundingData[0].symbol,
            category
          ]
        );
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге Bybit:', error);
      throw error;
    }
  }

  async getLatestTickers(category = 'linear') {
    try {

      
      const response = await axios.get(`${this.baseUrl}/v5/market/tickers`, {
        params: { category }
      });
      
      if (!response.data || !response.data.result || !response.data.result.list) {
        console.error('Неожиданный формат ответа от Bybit API tickers');
        return [];
      }
      
      return response.data.result.list;
    } catch (error) {
      this.handleApiError(error, `получении текущих тикеров с Bybit`);
      return [];
    }
  }

  async saveFundingDataFromTickers(tickerData, category) {
    try {
      if (!tickerData || tickerData.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      for (const data of tickerData) {
        try {
          // Skip if no funding rate information
          if (!data.fundingRate) {
            continue;
          }
          
          // Extract base symbol (e.g., BTCUSDT -> BTC)
          const baseSymbol = data.symbol.replace(/USDT$|USD$|BUSD$/, '');
          
          // Get or create asset record
          const assetId = await assetService.getAssetOrCreateBySymbol(baseSymbol);
          
          // Current timestamp 
          const currentTime = Date.now();
          
          // Save to database
          await db.query(
            `INSERT INTO bybit_funding_rates 
            (asset_id, symbol, funding_rate, funding_time, category, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (asset_id, symbol, funding_time) DO NOTHING`,
            [
              assetId,
              data.symbol,
              data.fundingRate,
              data.nextFundingTime || currentTime, // Use nextFundingTime if available
              category,
              currentTime
            ]
          );
          savedCount++;
          
          // Save metadata
          await db.query(
            `INSERT INTO bybit_asset_metadata 
            (asset_id, symbol, category, updated_at) 
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (asset_id, symbol) DO UPDATE SET 
              category = $3,
              updated_at = NOW()`,
            [
              assetId,
              data.symbol,
              category
            ]
          );
        } catch (innerError) {
          console.error(`Ошибка при сохранении данных о фандинге для ${data.symbol} Bybit:`, innerError);
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге Bybit:', error);
      throw error;
    }
  }

  // Добавить в класс BybitService метод для сохранения тикеров:
  async saveTickersData(tickerData) {
    try {
      const result = await db.query(
        `INSERT INTO external_data (source, content) VALUES ($1, $2) RETURNING id`,
        ['bybit_tickers', JSON.stringify(tickerData)]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error('Ошибка при сохранении тикеров Bybit:', error);
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

module.exports = new BybitService();