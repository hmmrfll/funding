// services/hyperliquidService.js
const axios = require('axios');
const config = require('../config/config');
const db = require('../config/db');
// Заменяем импорт arbitrageService на assetService
const assetService = require('./assetService');

class HyperliquidService {
  constructor() {
    this.baseUrl = config.api.hyperliquid.baseUrl;
  }

  async getAssetMeta() {
    try {
      console.log(`Запрос к HyperLiquid API: ${this.baseUrl}`);
      const response = await axios.post(this.baseUrl, {
        type: "meta"
      });
      
      if (!response.data || !response.data.universe) {
        console.error('Неожиданный формат ответа от HyperLiquid API meta');
        return [];
      }
      
      return response.data.universe;
    } catch (error) {
      this.handleApiError(error, 'получении метаданных с HyperLiquid');
      return [];
    }
  }

  async getAssetContexts() {
    try {
      console.log(`Запрос к HyperLiquid API: ${this.baseUrl}`);
      const response = await axios.post(this.baseUrl, {
        type: "metaAndAssetCtxs"
      });
      
      if (!response.data || !Array.isArray(response.data) || response.data.length < 2) {
        console.error('Неожиданный формат ответа от HyperLiquid API metaAndAssetCtxs');
        return { meta: [], contexts: [] };
      }
      
      return {
        meta: response.data[0].universe,
        contexts: response.data[1]
      };
    } catch (error) {
      this.handleApiError(error, 'получении контекстов активов с HyperLiquid');
      return { meta: [], contexts: [] };
    }
  }

  async getFundingHistory(coin, startTime, endTime = Date.now()) {
    try {
      console.log(`Запрос истории фандинга для ${coin} с HyperLiquid API`);
      const response = await axios.post(this.baseUrl, {
        type: "fundingHistory",
        coin,
        startTime,
        endTime
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error(`Неожиданный формат ответа от HyperLiquid API fundingHistory для ${coin}`);
        return [];
      }
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, `получении истории фандинга для ${coin} с HyperLiquid`);
      return [];
    }
  }

  async getPredictedFundings() {
    try {
      console.log(`Запрос прогнозируемых ставок фандинга с HyperLiquid API`);
      const response = await axios.post(this.baseUrl, {
        type: "predictedFundings"
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Неожиданный формат ответа от HyperLiquid API predictedFundings');
        return [];
      }
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'получении прогнозируемых ставок фандинга с HyperLiquid');
      return [];
    }
  }

  async saveAssetMetadata(assetMeta) {
    try {
      // Убедимся, что у нас есть данные
      if (!assetMeta || assetMeta.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      for (const meta of assetMeta) {
        try {
          // Получаем или создаем актив, используя assetService вместо arbitrageService
          const assetId = await assetService.getAssetOrCreateBySymbol(meta.name);
          
          // Сохраняем метаданные актива
          await db.query(
            `INSERT INTO hyperliquid_asset_metadata 
             (asset_id, sz_decimals, max_leverage, is_delisted, only_isolated, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (asset_id) DO UPDATE SET 
               sz_decimals = $2,
               max_leverage = $3,
               is_delisted = $4,
               only_isolated = $5,
               updated_at = NOW()`,
            [
              assetId,
              meta.szDecimals,
              meta.maxLeverage,
              meta.isDelisted || false,
              meta.onlyIsolated || false
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении метаданных актива ${meta.name} HyperLiquid:`, innerError);
          // Продолжаем с следующей записью
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении метаданных активов HyperLiquid:', error);
      throw error;
    }
  }

  async saveFundingData(meta, contexts) {
    try {
      // Убедимся, что у нас есть данные
      if (!meta || meta.length === 0 || !contexts || contexts.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      // Сопоставляем индексы контекстов с названиями активов
      for (let i = 0; i < meta.length; i++) {
        if (i >= contexts.length) break;
        
        try {
          const assetName = meta[i].name;
          const context = contexts[i];
          
          // Пропускаем активы без данных о фандинге
          if (!context || !context.funding) continue;
          
          // Получаем или создаем актив, используя assetService вместо arbitrageService
          const assetId = await assetService.getAssetOrCreateBySymbol(assetName);
          
          // Сохраняем данные о фандинге
          await db.query(
            `INSERT INTO hyperliquid_funding_rates 
             (asset_id, funding_rate, premium, created_at) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (asset_id, created_at) DO NOTHING`,
            [
              assetId,
              context.funding,
              context.premium || null,
              Date.now() // текущее время в миллисекундах
            ]
          );
          savedCount++;
        } catch (innerError) {
          console.error(`Ошибка при сохранении данных о фандинге для актива ${meta[i]?.name} HyperLiquid:`, innerError);
          // Продолжаем с следующей записью
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении данных о фандинге HyperLiquid:', error);
      throw error;
    }
  }

  async savePredictedFundings(predictedFundings) {
    try {
      // Убедимся, что у нас есть данные
      if (!predictedFundings || predictedFundings.length === 0) {
        return 0;
      }
      
      let savedCount = 0;
      
      for (const [assetSymbol, exchanges] of predictedFundings) {
        try {
          // Получаем или создаем актив
          const assetId = await assetService.getAssetOrCreateBySymbol(assetSymbol);
          
          // Сохраняем прогнозируемые ставки для каждой биржи
          for (const [exchange, data] of exchanges) {
            // Добавляем проверку на null и наличие нужных свойств
            if (data && data.fundingRate !== undefined && data.nextFundingTime !== undefined) {
              await db.query(
                `INSERT INTO predicted_funding_rates 
                 (asset_id, exchange, funding_rate, next_funding_time) 
                 VALUES ($1, $2, $3, $4)`,
                [
                  assetId,
                  exchange,
                  data.fundingRate,
                  data.nextFundingTime
                ]
              );
              savedCount++;
            } else {
              console.log(`Пропускаем сохранение данных для ${assetSymbol}/${exchange} из-за отсутствия данных о ставке фандинга`);
            }
          }
        } catch (innerError) {
          console.error(`Ошибка при сохранении прогнозируемых ставок фандинга для актива ${assetSymbol}:`, innerError);
          // Продолжаем с следующей записью
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Ошибка при сохранении прогнозируемых ставок фандинга:', error);
      throw error;
    }
  }

  // Добавить в класс HyperliquidService метод для сохранения контекстов активов:
  async saveAssetContextsData(contexts) {
    try {
      const result = await db.query(
        `INSERT INTO external_data (source, content) VALUES ($1, $2) RETURNING id`,
        ['hyperliquid_contexts', JSON.stringify(contexts)]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error('Ошибка при сохранении контекстов активов HyperLiquid:', error);
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

module.exports = new HyperliquidService();