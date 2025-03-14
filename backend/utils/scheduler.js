// utils/scheduler.js
const cron = require('node-cron');
const config = require('../config/config');
const arbitrageService = require('../services/arbitrageService');
const paradexService = require('../services/paradexService');
const hyperliquidService = require('../services/hyperliquidService');
const binanceService = require('../services/binanceService');
const bybitService = require('../services/bybitService');
const dydxService = require('../services/dydxService');
// Получаем список основных активов из конфигурации
const TOP_ASSETS = config.topAssets;

// Функция обновления данных с Paradex
async function updateParadexData() {
  try {
    console.log('Обновление данных Paradex...');
    const markets = await paradexService.getMarkets();
    console.log(`Получено ${markets.length} рынков с Paradex`);
   
    // Фильтруем рынки, оставляя только топовые активы
    const filteredMarkets = markets.filter(market => {
      // Проверяем, что это рынок с бессрочными контрактами и он входит в список TOP_ASSETS
      return market.asset_kind === 'PERP' && 
             TOP_ASSETS.includes(market.base_currency);
    });
    
    console.log(`Отфильтровано ${filteredMarkets.length} основных рынков`);
   
    // Сохраняем метаданные рынков и получаем список активов
    const assetsMap = new Map();
    for (const market of filteredMarkets) {
      try {
        const { assetId, symbol } = await paradexService.saveMarketData(market);
        assetsMap.set(market.symbol, { assetId, symbol });
      } catch (error) {
        console.error(`Ошибка при обработке рынка ${market.symbol}:`, error);
      }
    }
   
    // Для каждого рынка получаем и сохраняем данные о фандинге
    let totalSavedFunding = 0;
    for (const [marketSymbol, { assetId }] of assetsMap.entries()) {
      try {
        const fundingData = await paradexService.getFundingData(marketSymbol);
        console.log(`Получено ${fundingData.length} записей о фандинге для ${marketSymbol}`);
        
        const savedCount = await paradexService.saveFundingData(fundingData, assetId);
        totalSavedFunding += savedCount;
      } catch (error) {
        console.error(`Ошибка при получении данных о фандинге для ${marketSymbol}:`, error);
      }
    }
   
    console.log(`Всего сохранено ${totalSavedFunding} записей о фандинге с Paradex`);
    return totalSavedFunding;
 } catch (error) {
   console.error('Ошибка при обновлении данных Paradex:', error);
   return 0;
 }
}

// Добавить новые функции
async function updateBybitData() {
  try {
    console.log('Обновление данных Bybit...');
    let totalSaved = 0;
    
    for (const symbol of config.topAssets) {
      try {
        // Формат символа для Bybit
        const bybitSymbol = `${symbol}USDT`;
        
        // Получаем данные для linear category (USDT perpetual)
        const fundingData = await bybitService.getFundingRates(bybitSymbol, 'linear', 200);
        
        if (fundingData.length > 0) {
          console.log(`Получено ${fundingData.length} записей о фандинге для ${bybitSymbol} с Bybit`);
          
          const savedCount = await bybitService.saveFundingData(fundingData, 'linear', symbol);
          totalSaved += savedCount;
        }
      } catch (assetError) {
        console.error(`Ошибка при обработке актива ${symbol} для Bybit:`, assetError);
      }
    }
    
    console.log(`Всего сохранено ${totalSaved} записей о фандинге с Bybit`);
    return totalSaved;
  } catch (error) {
    console.error('Ошибка при обновлении данных Bybit:', error);
    return 0;
  }
}

async function updateDydxData() {
  try {
    console.log('Обновление данных DYDX...');
    let totalSaved = 0;
    
    for (const symbol of config.topAssets) {
      try {
        // Формат тикера для DYDX
        const dydxTicker = `${symbol}-USD`;
        
        const fundingData = await dydxService.getHistoricalFunding(dydxTicker, 200);
        
        if (fundingData.length > 0) {
          console.log(`Получено ${fundingData.length} записей о фандинге для ${dydxTicker} с DYDX`);
          
          const savedCount = await dydxService.saveFundingData(fundingData, dydxTicker);
          totalSaved += savedCount;
        }
      } catch (assetError) {
        console.error(`Ошибка при обработке актива ${symbol} для DYDX:`, assetError);
      }
    }
    
    console.log(`Всего сохранено ${totalSaved} записей о фандинге с DYDX`);
    return totalSaved;
  } catch (error) {
    console.error('Ошибка при обновлении данных DYDX:', error);
    return 0;
  }
}

// Функция обновления данных с HyperLiquid
async function updateHyperliquidData() {
 try {
   console.log('Обновление данных HyperLiquid...');
   
   // Получаем метаданные и контексты активов
   const { meta, contexts } = await hyperliquidService.getAssetContexts();
   console.log(`Получено ${meta.length} активов и ${contexts.length} контекстов с HyperLiquid`);
   
   // Фильтруем активы по списку TOP_ASSETS
   const filteredMeta = meta.filter(m => TOP_ASSETS.includes(m.name));
   const filteredContexts = [];
   
   // Подготавливаем соответствующие контексты для отфильтрованных активов
   for (let i = 0; i < meta.length; i++) {
     if (i < contexts.length && TOP_ASSETS.includes(meta[i].name)) {
       filteredContexts.push(contexts[i]);
     }
   }
   
   console.log(`Отфильтровано ${filteredMeta.length} основных активов`);
   
   // Сохраняем метаданные активов
   const savedMetaCount = await hyperliquidService.saveAssetMetadata(filteredMeta);
   console.log(`Сохранено ${savedMetaCount} метаданных активов с HyperLiquid`);
   
   // Сохраняем данные о фандинге
   const savedFundingCount = await hyperliquidService.saveFundingData(filteredMeta, filteredContexts);
   console.log(`Сохранено ${savedFundingCount} записей о фандинге с HyperLiquid`);
   
   // Получаем и сохраняем прогнозируемые ставки фандинга
   const predictedFundings = await hyperliquidService.getPredictedFundings();
   
   // Фильтруем прогнозируемые ставки по списку TOP_ASSETS
   const filteredPredictedFundings = predictedFundings.filter(pf => 
     TOP_ASSETS.includes(pf[0])
   );
   
   if (filteredPredictedFundings.length > 0) {
     const savedPredictedCount = await hyperliquidService.savePredictedFundings(filteredPredictedFundings);
     console.log(`Сохранено ${savedPredictedCount} прогнозируемых ставок фандинга`);
   }
   
   return savedFundingCount;
 } catch (error) {
   console.error('Ошибка при обновлении данных HyperLiquid:', error);
   return 0;
 }
}

async function updateBinanceData() {
  try {
    console.log('Обновление данных Binance...');
    
    // Получаем информацию о настройках фандинга
    const fundingInfo = await binanceService.getFundingInfo();
    console.log(`Получено ${fundingInfo.length} записей о настройках фандинга с Binance`);
    
    // Фильтруем активы по списку TOP_ASSETS
    const filteredFundingInfo = fundingInfo.filter(info => {
      const baseSymbol = info.symbol.replace(/USDT$|USD$|BUSD$/, '');
      return TOP_ASSETS.includes(baseSymbol);
    });
    
    console.log(`Отфильтровано ${filteredFundingInfo.length} основных активов`);
    
    // Сохраняем метаданные
    const savedInfoCount = await binanceService.saveFundingInfo(filteredFundingInfo);
    console.log(`Сохранено ${savedInfoCount} метаданных активов с Binance`);
    
    // Получаем последние ставки фандинга для каждого символа
    let totalSavedFunding = 0;
    for (const info of filteredFundingInfo) {
      try {
        const fundingRates = await binanceService.getFundingRates(info.symbol, 1);
        
        if (fundingRates.length > 0) {
          const savedCount = await binanceService.saveFundingData(fundingRates);
          totalSavedFunding += savedCount;
        }
      } catch (error) {
        console.error(`Ошибка при получении ставок фандинга для ${info.symbol}:`, error);
      }
    }
    
    console.log(`Всего сохранено ${totalSavedFunding} записей о фандинге с Binance`);
    return totalSavedFunding;
  } catch (error) {
    console.error('Ошибка при обновлении данных Binance:', error);
    return 0;
  }
}

// Функция обновления данных обеих бирж
async function updateExchangeData() {
  try {
    console.log('Начало обновления данных бирж...');
    
    // Обновляем данные со всех бирж параллельно
    const [paradexResult, hyperliquidResult, binanceResult, bybitResult, dydxResult] = await Promise.all([
      updateParadexData(),
      updateHyperliquidData(),
      updateBinanceData(),
      updateBybitData(),
      updateDydxData()
    ]);
    
    // Рассчитываем арбитражные возможности
    if ((paradexResult > 0 && hyperliquidResult > 0) || 
        (paradexResult > 0 && binanceResult > 0) || 
        (hyperliquidResult > 0 && binanceResult > 0) ||
        (bybitResult > 0 && paradexResult > 0) ||
        (bybitResult > 0 && hyperliquidResult > 0) ||
        (bybitResult > 0 && binanceResult > 0) ||
        (dydxResult > 0 && paradexResult > 0) ||
        (dydxResult > 0 && hyperliquidResult > 0) ||
        (dydxResult > 0 && binanceResult > 0) ||
        (dydxResult > 0 && bybitResult > 0)) {
      const opportunities = await arbitrageService.calculateArbitrageOpportunities();
      console.log(`Рассчитано ${opportunities.length} арбитражных возможностей`);
    }
    
    console.log('Обновление данных бирж завершено успешно');
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении данных бирж:', error);
    return false;
  }
}

function init() {
  // Проверяем валидность cron-выражения
  if (!cron.validate(config.scheduler.interval)) {
    console.error(`Неверный формат cron-выражения: ${config.scheduler.interval}`);
    return;
  }
  
  console.log(`Планировщик настроен с интервалом: ${config.scheduler.interval}`);
  
  // Запускаем задачу по расписанию
  cron.schedule(config.scheduler.interval, updateExchangeData);
  
  // Запускаем первичное обновление данных при старте приложения
  console.log('Запуск первичного обновления данных...');
  updateExchangeData();
}

// Обновить экспорт модуля
module.exports = {
  init,
  updateExchangeData,
  updateParadexData,
  updateHyperliquidData,
  updateBinanceData,
  updateBybitData,
  updateDydxData
};