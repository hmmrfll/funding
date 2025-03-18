// utils/scheduler.js
const cron = require('node-cron');
const config = require('../config/config');
const db = require('../config/db');
const arbitrageService = require('../services/arbitrageService');
const paradexService = require('../services/paradexService');
const hyperliquidService = require('../services/hyperliquidService');
const binanceService = require('../services/binanceService');
const bybitService = require('../services/bybitService');
const okxService = require('../services/okxService');

// Получаем список основных активов из конфигурации
const TOP_ASSETS = config.topAssets;

// Функция обновления данных с Paradex
async function updateParadexData() {
  try {

    const markets = await paradexService.getMarkets();

   
    try {
      // Получаем и сохраняем данные о статистике рынков
      const marketsSummary = await paradexService.getMarketsSummary();
      if (marketsSummary && marketsSummary.length > 0) {

        
        await db.query(
          `INSERT INTO external_data (source, content) VALUES ($1, $2)`,
          ['paradex_markets_summary', JSON.stringify(marketsSummary)]
        );

      }
    } catch (summaryError) {
      console.error('Ошибка при получении или сохранении статистики рынков Paradex:', summaryError);
    }
    
    // Фильтруем рынки, оставляя только топовые активы
    const filteredMarkets = markets.filter(market => {
      return market.asset_kind === 'PERP' && 
             TOP_ASSETS.includes(market.base_currency);
    });
    

   
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

        
        const savedCount = await paradexService.saveFundingData(fundingData, assetId);
        totalSavedFunding += savedCount;
      } catch (error) {
        console.error(`Ошибка при получении данных о фандинге для ${marketSymbol}:`, error);
      }
    }
   

    return totalSavedFunding;
 } catch (error) {
   console.error('Ошибка при обновлении данных Paradex:', error);
   return 0;
 }
}

// Функция обновления данных с Bybit
async function updateBybitData() {
  try {

    let totalSaved = 0;
    
    // Get latest tickers which include funding rates
    const tickerData = await bybitService.getLatestTickers('linear');
    
    if (tickerData.length > 0) {

      
      try {
        // Сохраняем сырые данные тикеров для использования в метриках
        await bybitService.saveTickersData(tickerData);

      } catch (saveError) {
        console.error('Ошибка при сохранении тикеров Bybit:', saveError);
      }
      
      // Filter tickers for top assets
      const filteredTickers = tickerData.filter(ticker => {
        const baseSymbol = ticker.symbol.replace(/USDT$|USD$|BUSD$/, '');
        return TOP_ASSETS.includes(baseSymbol);
      });
      

      
      // Save ticker data with funding rates
      const savedCount = await bybitService.saveFundingDataFromTickers(filteredTickers, 'linear');
      totalSaved += savedCount;
    }
    

    return totalSaved;
  } catch (error) {
    console.error('Ошибка при обновлении данных Bybit:', error);
    return 0;
  }
}

async function updateHyperliquidData() {
 try {

   
   // Получаем метаданные и контексты активов
   const { meta, contexts } = await hyperliquidService.getAssetContexts();

   
   if (contexts && contexts.length > 0) {

     
     try {
       await hyperliquidService.saveAssetContextsData(contexts);

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
   

   
   // Сохраняем метаданные активов
   const savedMetaCount = await hyperliquidService.saveAssetMetadata(filteredMeta);

   
   // Сохраняем данные о фандинге
   const savedFundingCount = await hyperliquidService.saveFundingData(filteredMeta, filteredContexts);

   
   // Получаем и сохраняем прогнозируемые ставки фандинга
   const predictedFundings = await hyperliquidService.getPredictedFundings();
   
   // Фильтруем прогнозируемые ставки по списку TOP_ASSETS
   const filteredPredictedFundings = predictedFundings.filter(pf => 
     TOP_ASSETS.includes(pf[0])
   );
   
   if (filteredPredictedFundings.length > 0) {
     const savedPredictedCount = await hyperliquidService.savePredictedFundings(filteredPredictedFundings);

   }
   
   return savedFundingCount;
 } catch (error) {
   console.error('Ошибка при обновлении данных HyperLiquid:', error);
   return 0;
 }
}

async function updateBinanceData() {
  try {

    
    // Получаем информацию о настройках фандинга
    const fundingInfo = await binanceService.getFundingInfo();

    
    // Фильтруем активы по списку TOP_ASSETS
    const filteredFundingInfo = fundingInfo.filter(info => {
      const baseSymbol = info.symbol.replace(/USDT$|USD$|BUSD$/, '');
      return TOP_ASSETS.includes(baseSymbol);
    });
    

    
    // Сохраняем метаданные
    const savedInfoCount = await binanceService.saveFundingInfo(filteredFundingInfo);

    
    // Получаем последние ставки фандинга для каждого символа
    let totalSavedFunding = 0;
    
    // Создаем массив промисов для параллельного выполнения запросов
    const promises = filteredFundingInfo.map(async (info) => {
      try {
        // Делаем паузу между запросами, чтобы не превышать ограничение API
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const fundingRates = await binanceService.getFundingRates(info.symbol, 1);
        
        if (fundingRates.length > 0) {
          return await binanceService.saveFundingData(fundingRates);
        }
        return 0;
      } catch (error) {
        console.error(`Ошибка при получении ставок фандинга для ${info.symbol}:`, error);
        return 0;
      }
    });
    
    // Ждем выполнения всех запросов и суммируем результаты
    const results = await Promise.all(promises);
    totalSavedFunding = results.reduce((sum, count) => sum + count, 0);
    

    return totalSavedFunding;
  } catch (error) {
    console.error('Ошибка при обновлении данных Binance:', error);
    return 0;
  }
}

async function updateOkxData() {
  try {

    
    // Получаем список активов для запроса
    const instruments = TOP_ASSETS.map(asset => `${asset}-USDT-SWAP`);
    
    // Для каждого инструмента получаем и сохраняем данные о фандинге
    let totalSavedFunding = 0;
    
    // Создаем список обещаний для параллельного выполнения запросов
    const promises = instruments.map(async (instId) => {
      try {
        // Делаем паузу между запросами, чтобы не превышать ограничение API
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const fundingData = await okxService.getFundingRates(instId);
        
        if (fundingData.length > 0) {
          return await okxService.saveFundingData(fundingData);
        }
        return 0;
      } catch (error) {
        console.error(`Ошибка при получении данных о фандинге для ${instId}:`, error);
        return 0;
      }
    });
    
    // Дожидаемся всех запросов и суммируем результаты
    const results = await Promise.all(promises);
    totalSavedFunding = results.reduce((sum, count) => sum + count, 0);
    

    return totalSavedFunding;
  } catch (error) {
    console.error('Ошибка при обновлении данных OKX:', error);
    return 0;
  }
}

// Функция обновления данных всех бирж
async function updateExchangeData() {
  try {
    console.log('Начало обновления данных бирж...');
    
    // Обновляем данные со всех бирж параллельно
    const results = await Promise.all([
      updateParadexData(),
      updateHyperliquidData(),
      updateBinanceData(),
      updateBybitData(),
      updateOkxData(),
    ]);
    
    const [paradexResult, hyperliquidResult, binanceResult, bybitResult, okxResult] = results;
    
    // Рассчитываем арбитражные возможности, если хотя бы у двух бирж есть данные
    const hasData = results.filter(result => result > 0).length >= 2;
    
    if (hasData) {
      const opportunities = await arbitrageService.calculateArbitrageOpportunities();

    } else {
      console.log('Недостаточно данных для расчета арбитражных возможностей');
    }
    
    console.log('Обновление данных бирж завершено успешно');
    
    // Очистка старых данных (старше 7 дней)
    await cleanOldData();
    
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении данных бирж:', error);
    return false;
  }
}

// Функция для очистки старых данных
async function cleanOldData() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timestamp = sevenDaysAgo.getTime();
    
    // Удаляем данные старше 7 дней из всех таблиц с фандинг-ставками
    const tables = [
      'paradex_funding_rates', 
      'hyperliquid_funding_rates', 
      'binance_funding_rates', 
      'bybit_funding_rates', 
      'dydx_funding_rates',
      'okx_funding_rates'
    ];
    
    for (const table of tables) {
      const result = await db.query(`DELETE FROM ${table} WHERE created_at < $1`, [timestamp]);
      console.log(`Удалено ${result.rowCount} старых записей из таблицы ${table}`);
    }
    
    // Удаляем старые арбитражные возможности
    const arbResult = await db.query(
      `DELETE FROM funding_arbitrage_opportunities WHERE created_at < NOW() - INTERVAL '7 days'`
    );
    console.log(`Удалено ${arbResult.rowCount} старых арбитражных возможностей`);
    
    // Удаляем старые данные из external_data
    const externalResult = await db.query(
      `DELETE FROM external_data WHERE created_at < NOW() - INTERVAL '7 days'`
    );
    console.log(`Удалено ${externalResult.rowCount} старых записей из external_data`);
    
    console.log('Очистка устаревших данных завершена');
  } catch (error) {
    console.error('Ошибка при очистке старых данных:', error);
  }
}

function init() {
  // Настраиваем обновление каждые 30 минут
  const cronExpression = '*/30 * * * *'; // Каждые 30 минут
  
  console.log(`Планировщик настроен с интервалом: каждые 30 минут`);
  
  // Запускаем задачу по расписанию
  cron.schedule(cronExpression, updateExchangeData);
  
  // Запускаем первичное обновление данных при старте приложения
  console.log('Запуск первичного обновления данных...');
  updateExchangeData();
}

module.exports = {
  init,
  updateExchangeData,
  updateParadexData,
  updateHyperliquidData,
  updateBinanceData,
  updateBybitData,
  updateOkxData
};