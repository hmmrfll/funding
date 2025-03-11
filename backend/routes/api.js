// routes/api.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const arbitrageService = require('../services/arbitrageService');
const scheduler = require('../utils/scheduler');

// 1. Получение текущих арбитражных возможностей
router.get('/opportunities', async (req, res, next) => {
  try {
    const opportunities = await arbitrageService.getLatestOpportunities();
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

// 2. Получение исторических данных по конкретному активу
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = 'day' } = req.query;
    
    let timeInterval;
    switch(period) {
      case 'week':
        timeInterval = 'INTERVAL \'7 days\'';
        break;
      case 'month':
        timeInterval = 'INTERVAL \'30 days\'';
        break;
      default:
        timeInterval = 'INTERVAL \'24 hours\'';
    }
    
    // Получаем исторические данные по арбитражу для конкретного актива
    // Исправлено: добавлены алиасы таблиц для избежания неоднозначности столбцов
    const query = `
      WITH p_data AS (
        SELECT 
          asset_id,
          funding_rate,
          paradex_funding_rates.created_at,
          paradex_funding_rates.timestamp
        FROM paradex_funding_rates
        JOIN assets ON assets.id = paradex_funding_rates.asset_id
        WHERE assets.symbol = $1
        AND paradex_funding_rates.timestamp > NOW() - ${timeInterval}
        ORDER BY paradex_funding_rates.created_at DESC
      ),
      h_data AS (
        SELECT 
          asset_id,
          funding_rate,
          hyperliquid_funding_rates.created_at,
          hyperliquid_funding_rates.timestamp
        FROM hyperliquid_funding_rates
        JOIN assets ON assets.id = hyperliquid_funding_rates.asset_id
        WHERE assets.symbol = $1
        AND hyperliquid_funding_rates.timestamp > NOW() - ${timeInterval}
        ORDER BY hyperliquid_funding_rates.created_at DESC
      )
      SELECT 
        a.symbol,
        p.funding_rate AS paradex_rate,
        h.funding_rate AS hyperliquid_rate,
        (p.funding_rate - h.funding_rate) AS rate_difference,
        (p.funding_rate - h.funding_rate) * 3 * 365 AS annualized_return,
        EXTRACT(EPOCH FROM p.timestamp) * 1000 AS timestamp
      FROM assets a
      JOIN p_data p ON a.id = p.asset_id
      JOIN h_data h ON a.id = h.asset_id
      WHERE DATE_TRUNC('hour', p.timestamp) = DATE_TRUNC('hour', h.timestamp)
      ORDER BY p.timestamp ASC
    `;
    
    const result = await db.query(query, [symbol]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 3. Получение списка доступных активов
router.get('/assets', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.symbol,
        a.name,
        a.is_active,
        COUNT(fao.id) AS opportunity_count
      FROM assets a
      LEFT JOIN funding_arbitrage_opportunities fao ON a.id = fao.asset_id
      WHERE a.is_active = TRUE
      GROUP BY a.id, a.symbol, a.name, a.is_active
      ORDER BY a.symbol
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 4. Получение статистики арбитража
router.get('/statistics', async (req, res, next) => {
  try {
    const { period = 'day' } = req.query;
    
    let timeInterval;
    switch(period) {
      case 'week':
        timeInterval = 'INTERVAL \'7 days\'';
        break;
      case 'month':
        timeInterval = 'INTERVAL \'30 days\'';
        break;
      default:
        timeInterval = 'INTERVAL \'24 hours\'';
    }
    
    const query = `
      SELECT 
        a.symbol,
        COUNT(*) AS total_opportunities,
        AVG(ABS(fao.rate_difference)) AS avg_rate_difference,
        MAX(ABS(fao.rate_difference)) AS max_rate_difference,
        AVG(fao.annualized_return) AS avg_annualized_return,
        MAX(fao.annualized_return) AS max_annualized_return
      FROM assets a
      JOIN funding_arbitrage_opportunities fao ON a.id = fao.asset_id
      WHERE fao.created_at >= NOW() - ${timeInterval}
      GROUP BY a.symbol
      ORDER BY avg_annualized_return DESC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 5. Получение данных о текущих ставках фандинга
router.get('/rates/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Исправлено: добавлены алиасы таблиц для избежания неоднозначности столбцов
    const query = `
      WITH p_latest AS (
        SELECT 
          asset_id,
          funding_rate,
          funding_premium,
          paradex_funding_rates.created_at,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY paradex_funding_rates.created_at DESC) AS rn
        FROM paradex_funding_rates
        JOIN assets ON assets.id = paradex_funding_rates.asset_id
        WHERE assets.symbol = $1
      ),
      h_latest AS (
        SELECT 
          asset_id,
          funding_rate,
          premium,
          hyperliquid_funding_rates.created_at,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY hyperliquid_funding_rates.created_at DESC) AS rn
        FROM hyperliquid_funding_rates
        JOIN assets ON assets.id = hyperliquid_funding_rates.asset_id
        WHERE assets.symbol = $1
      )
      SELECT 
        a.symbol,
        p.funding_rate AS paradex_rate,
        p.funding_premium AS paradex_premium,
        h.funding_rate AS hyperliquid_rate,
        h.premium AS hyperliquid_premium,
        (p.funding_rate - h.funding_rate) AS rate_difference
      FROM assets a
      JOIN p_latest p ON a.id = p.asset_id AND p.rn = 1
      JOIN h_latest h ON a.id = h.asset_id AND h.rn = 1
      WHERE a.symbol = $1
    `;
    
    const result = await db.query(query, [symbol]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// 6. Принудительное обновление данных
router.post('/update', async (req, res, next) => {
  try {
    await scheduler.updateExchangeData();
    await arbitrageService.calculateArbitrageOpportunities();
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    next(error);
  }
});

// 7. Получение топ-N арбитражных возможностей
router.get('/top-opportunities', async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    
    const query = `
      SELECT 
        a.symbol,
        fao.paradex_rate,
        fao.hyperliquid_rate,
        fao.rate_difference,
        fao.annualized_return,
        fao.recommended_strategy,
        fao.created_at
      FROM funding_arbitrage_opportunities fao
      JOIN assets a ON fao.asset_id = a.id
      ORDER BY ABS(fao.rate_difference) DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 8. Получение метаданных по активам
router.get('/metadata/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const query = `
      SELECT 
        a.symbol,
        pm.market,
        pm.base_currency,
        pm.quote_currency,
        pm.settlement_currency,
        pm.funding_period_hours,
        pm.max_funding_rate,
        pm.interest_rate,
        hm.sz_decimals,
        hm.max_leverage
      FROM assets a
      LEFT JOIN paradex_asset_metadata pm ON a.id = pm.asset_id
      LEFT JOIN hyperliquid_asset_metadata hm ON a.id = hm.asset_id
      WHERE a.symbol = $1
    `;
    
    const result = await db.query(query, [symbol]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// 9. Получение прогнозируемых ставок фандинга
router.get('/predicted-rates/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const query = `
      SELECT 
        a.symbol,
        pr.exchange,
        pr.funding_rate,
        pr.next_funding_time,
        pr.created_at
      FROM predicted_funding_rates pr
      JOIN assets a ON pr.asset_id = a.id
      WHERE a.symbol = $1
      ORDER BY pr.exchange, pr.created_at DESC
    `;
    
    const result = await db.query(query, [symbol]);
    
    // Группируем результаты по биржам
    const groupedResults = result.rows.reduce((acc, row) => {
      if (!acc[row.exchange]) {
        acc[row.exchange] = [];
      }
      acc[row.exchange].push(row);
      return acc;
    }, {});
    
    res.json(groupedResults);
  } catch (error) {
    next(error);
  }
});

module.exports = router;