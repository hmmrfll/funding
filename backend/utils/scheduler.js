// utils/scheduler.js
const cron = require('node-cron');
const config = require('../config/config');
const arbitrageService = require('../services/arbitrageService');
const paradexService = require('../services/paradexService');
const hyperliquidService = require('../services/hyperliquidService');

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

// Функция обновления данных обеих бирж
async function updateExchangeData() {
 try {
   console.log('Начало обновления данных бирж...');
   
   // Обновляем данные с обеих бирж параллельно
   const [paradexResult, hyperliquidResult] = await Promise.all([
     updateParadexData(),
     updateHyperliquidData()
   ]);
   
   // Рассчитываем арбитражные возможности
   if (paradexResult > 0 && hyperliquidResult > 0) {
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

// Функция инициализации планировщика - восстанавливаем эту функцию
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

module.exports = {
  init,
  updateExchangeData, // Экспортируем для возможности ручного запуска
  updateParadexData,
  updateHyperliquidData
};