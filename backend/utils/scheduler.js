// utils/scheduler.js
const cron = require('node-cron');
const config = require('../config/config');
const db = require('../config/db'); // Добавляем импорт db
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
   
    try {
      // Получаем и сохраняем данные о статистике рынков
      const marketsSummary = await paradexService.getMarketsSummary();
      if (marketsSummary && marketsSummary.length > 0) {
        console.log(`Получено ${marketsSummary.length} записей о статистике рынков с Paradex`);
        
        await db.query(
          `INSERT INTO external_data (source, content) VALUES ($1, $2)`,
          ['paradex_markets_summary', JSON.stringify(marketsSummary)]
        );
        console.log('Сохранены данные о статистике рынков Paradex');
      }
    } catch (summaryError) {
      console.error('Ошибка при получении или сохранении статистики рынков Paradex:', summaryError);
    }
    
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

// Функция обновления данных с Bybit
async function updateBybitData() {
  try {
    console.log('Обновление данных Bybit...');
    let totalSaved = 0;
    
    // Get latest tickers which include funding rates
    const tickerData = await bybitService.getLatestTickers('linear');
    
    if (tickerData.length > 0) {
      console.log(`Получено ${tickerData.length} тикеров с Bybit`);
      
      try {
        // Сохраняем сырые данные тикеров для использования в метриках
        await bybitService.saveTickersData(tickerData);
        console.log('Сохранены сырые данные тикеров Bybit для метрик');
      } catch (saveError) {
        console.error('Ошибка при сохранении тикеров Bybit:', saveError);
      }
      
      // Filter tickers for top assets
      const filteredTickers = tickerData.filter(ticker => {
        const baseSymbol = ticker.symbol.replace(/USDT$|USD$|BUSD$/, '');
        return config.topAssets.includes(baseSymbol);
      });
      
      console.log(`Отфильтровано ${filteredTickers.length} тикеров для основных активов`);
      
      // Save ticker data with funding rates
      const savedCount = await bybitService.saveFundingDataFromTickers(filteredTickers, 'linear');
      totalSaved += savedCount;
    }
    
    console.log(`Всего сохранено ${totalSaved} записей о фандинге с Bybit`);
    return totalSaved;
  } catch (error) {
    console.error('Ошибка при обновлении данных Bybit:', error);
    return 0;
  }
}

async function updateHyperliquidData() {
 try {
   console.log('Обновление данных HyperLiquid...');
   
   // Получаем метаданные и контексты активов
   const { meta, contexts } = await hyperliquidService.getAssetContexts();
   console.log(`Получено ${meta.length} активов и ${contexts.length} контекстов с HyperLiquid`);
   
   if (contexts && contexts.length > 0) {
     console.log(`Получено ${contexts.length} контекстов активов с HyperLiquid`);
     
     try {
       await hyperliquidService.saveAssetContextsData(contexts);
       console.log('Сохранены контексты активов HyperLiquid для метрик');
     } catch (saveError) {
       console.error('Ошибка при сохранении контекстов HyperLiquid:', saveError);
     }
   }
   
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

// Функция обновления данных всех бирж
async function updateExchangeData() {
  try {
    console.log('Начало обновления данных бирж...');
    
    // Обновляем данные со всех бирж параллельно
    const [paradexResult, hyperliquidResult, binanceResult, bybitResult] = await Promise.all([
      updateParadexData(),
      updateHyperliquidData(),
      updateBinanceData(),
      updateBybitData(),
      // DYDX исключен, т.к. нет реальных данных
    ]);
    
    // Рассчитываем арбитражные возможности
    if ((paradexResult > 0 && hyperliquidResult > 0) || 
        (paradexResult > 0 && binanceResult > 0) || 
        (hyperliquidResult > 0 && binanceResult > 0) ||
        (bybitResult > 0 && paradexResult > 0) ||
        (bybitResult > 0 && hyperliquidResult > 0) ||
        (bybitResult > 0 && binanceResult > 0)) {
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
  
  // Выполняем первичное получение статистики рынков Paradex
  paradexService.getMarketsSummary()
    .then(marketsSummary => {
      if (marketsSummary && marketsSummary.length > 0) {
        console.log(`Получено ${marketsSummary.length} записей о статистике рынков с Paradex`);
        return db.query(
          `INSERT INTO external_data (source, content) VALUES ($1, $2)`,
          ['paradex_markets_summary', JSON.stringify(marketsSummary)]
        );
      }
    })
    .then(() => {
      console.log('Сохранены данные о статистике рынков Paradex на старте');
      updateExchangeData();
    })
    .catch(error => {
      console.error('Ошибка при первичном получении статистики рынков Paradex:', error);
      updateExchangeData();
    });
}

module.exports = {
  init,
  updateExchangeData,
  updateParadexData,
  updateHyperliquidData,
  updateBinanceData,
  updateBybitData
};