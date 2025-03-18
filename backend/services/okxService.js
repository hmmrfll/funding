// services/okxService.js
const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
const assetService = require('./assetService');

class OkxService {
  constructor() {
    this.baseUrl = config.api.okx.baseUrl || 'https://www.okx.com';
  }

  async getFundingRates(instId = null) {
    try {
      console.log(`Запрос ставок фандинга с OKX API ${instId ? `для ${instId}` : ''}`);
      
      const params = {};
      if (instId) params.instId = instId;
      
      const response = await axios.get(`${this.baseUrl}/api/v5/public/funding-rate`, { params });
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        console.error('Неожиданный формат ответа от OKX API funding-rate');
        return [];
      }
      
      return response.data.data;
    } catch (error) {
      this.handleApiError(error, `получении ставок фандинга с OKX ${instId ? `для ${instId}` : ''}`);
      return [];
    }
  }

  async saveFundingData(fundingData) {
    try {
      if (!fundingData || fundingData.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      for (const data of fundingData) {
        try {
          // Извлекаем базовый символ из инструмента (например, из BTC-USDT-SWAP получаем BTC)
          const baseSymbol = data.instId.split('-')[0];
          
          // Получаем или создаем актив
          const assetId = await assetService.getAssetOrCreateBySymbol(baseSymbol);
          
          // Сохраняем данные о фандинге
          await db.query(
            `INSERT INTO okx_funding_rates 
             (asset_id, inst_id, funding_rate, funding_time, next_funding_time, premium, sett_funding_rate, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (asset_id, inst_id, funding_time) DO NOTHING`,
            [
              assetId,
              data.instId,
              data.fundingRate,
              data.fundingTime,
              data.nextFundingTime || null,
              data.premium || null,
              data.settFundingRate || null,
              Date.now() // текущее время в миллисекундах
            ]
          );
          
          // Сохраняем метаданные актива
          await db.query(
            `INSERT INTO okx_asset_metadata 
             (asset_id, inst_id, min_funding_rate, max_funding_rate, updated_at) 
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (asset_id, inst_id) DO UPDATE SET 
               min_funding_rate = $3,
               max_funding_rate = $4,
               updated_at = NOW()`,
            [
              assetId,
              data.instId,
              data.minFundingRate || null,
              data.maxFundingRate || null
            ]
          );
          
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении данных о фандинге для ${data.instId} OKX:`, innerError);
          // Продолжаем с следующей записью
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге OKX:', error);
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

module.exports = new OkxService();