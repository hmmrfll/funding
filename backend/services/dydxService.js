const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
const assetService = require('./assetService');

class DydxService {
  constructor() {
    this.baseUrl = config.api.dydx.baseUrl;
  }

  async getHistoricalFunding(ticker, limit = 200) {
    try {
      console.log(`Запрос истории ставок фандинга с DYDX API для ${ticker}`);
      
      const response = await axios.get(`${this.baseUrl}/historicalFunding/${ticker}`, {
        params: { limit },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.data || !response.data.historicalFunding) {
        console.error('Неожиданный формат ответа от DYDX API historicalFunding');
        return [];
      }
      
      return response.data.historicalFunding;
    } catch (error) {
      this.handleApiError(error, `получении ставок фандинга для ${ticker} с DYDX`);
      return [];
    }
  }

  async saveFundingData(fundingData, ticker) {
    try {
      if (!fundingData || fundingData.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      // Извлекаем базовый символ (ETH-USD -> ETH)
      const baseSymbol = ticker.split('-')[0];
      
      // Получаем или создаем актив
      const assetId = await assetService.getAssetOrCreateBySymbol(baseSymbol);
      
      for (const data of fundingData) {
        try {
          // Преобразуем ISO дату в миллисекунды
          const effectiveAt = new Date(data.effectiveAt).getTime();
          
          await db.query(
            `INSERT INTO dydx_funding_rates 
             (asset_id, ticker, funding_rate, price, effective_at, effective_at_height, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (asset_id, ticker, effective_at) DO NOTHING`,
            [
              assetId,
              ticker,
              data.rate,
              data.price,
              effectiveAt,
              data.effectiveAtHeight,
              Date.now()
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении данных о фандинге для ${ticker} DYDX:`, innerError);
        }
      }
      
      // Сохраняем метаданные
      await db.query(
        `INSERT INTO dydx_asset_metadata 
         (asset_id, ticker, updated_at) 
         VALUES ($1, $2, NOW())
         ON CONFLICT (asset_id, ticker) DO UPDATE SET 
           updated_at = NOW()`,
        [
          assetId,
          ticker
        ]
      );
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге DYDX:', error);
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

module.exports = new DydxService();