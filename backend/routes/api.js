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
// 2. Получение исторических данных по конкретному активу
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = 'day', exchanges } = req.query;
    
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
    
    // Базовый запрос для получения данных о ставках с разных бирж
    let query = `
      WITH asset_data AS (
        SELECT id FROM assets WHERE symbol = $1
      ),
      time_series AS (
        SELECT generate_series(
          date_trunc('hour', NOW() - ${timeInterval}),
          date_trunc('hour', NOW()),
          '1 hour'::interval
        ) AS time_point
      ),
      paradex_data AS (
        SELECT 
          'Paradex' as exchange1,
          funding_rate as rate1,
          date_trunc('hour', to_timestamp(created_at / 1000)) as time_point
        FROM paradex_funding_rates
        JOIN asset_data ON asset_data.id = paradex_funding_rates.asset_id
        WHERE paradex_funding_rates.timestamp > NOW() - ${timeInterval}
      ),
      hyperliquid_data AS (
        SELECT 
          'HyperLiquid' as exchange2,
          funding_rate as rate2,
          date_trunc('hour', to_timestamp(created_at / 1000)) as time_point
        FROM hyperliquid_funding_rates
        JOIN asset_data ON asset_data.id = hyperliquid_funding_rates.asset_id
        WHERE hyperliquid_funding_rates.timestamp > NOW() - ${timeInterval}
      ),
      binance_data AS (
        SELECT 
          'Binance' as exchange3,
          funding_rate as rate3,
          date_trunc('hour', to_timestamp(funding_time / 1000)) as time_point
        FROM binance_funding_rates
        JOIN asset_data ON asset_data.id = binance_funding_rates.asset_id
        WHERE to_timestamp(funding_time / 1000) > NOW() - ${timeInterval}
      )
    `;
    
    // Динамически формируем запрос в зависимости от выбранных бирж
    const exchangesList = exchanges ? exchanges.split(',') : ['Paradex', 'HyperLiquid', 'Binance'];
    
    if (exchangesList.length === 2) {
      const [exchange1, exchange2] = exchangesList;
      
      // Формируем динамические части запроса на основе выбранных бирж
      const getExchangeData = (exchange) => {
        switch (exchange) {
          case 'Paradex': return 'paradex_data';
          case 'HyperLiquid': return 'hyperliquid_data';
          case 'Binance': return 'binance_data';
          default: return null;
        }
      };
      
      const exchange1Data = getExchangeData(exchange1);
      const exchange2Data = getExchangeData(exchange2);
      
      if (exchange1Data && exchange2Data) {
        query += `
          SELECT 
            '${symbol}' as symbol,
            t.time_point as timestamp,
            ex1.exchange1,
            ex1.rate1,
            ex2.exchange2,
            ex2.rate2,
            COALESCE(ex1.rate1, 0) - COALESCE(ex2.rate2, 0) as rate_difference,
            (COALESCE(ex1.rate1, 0) - COALESCE(ex2.rate2, 0)) * 3 * 365 as annualized_return
          FROM time_series t
          LEFT JOIN ${exchange1Data} ex1 ON t.time_point = ex1.time_point
          LEFT JOIN ${exchange2Data} ex2 ON t.time_point = ex2.time_point
          WHERE ex1.rate1 IS NOT NULL OR ex2.rate2 IS NOT NULL
          ORDER BY t.time_point ASC
        `;
      } else {
        return res.status(400).json({ error: 'Invalid exchange selection' });
      }
    } else {
      // Если выбрано 3 биржи или не указаны конкретные биржи, возвращаем данные по всем биржам
      query += `
        SELECT 
          '${symbol}' as symbol,
          t.time_point as timestamp,
          p.exchange1,
          p.rate1,
          h.exchange2,
          h.rate2,
          b.exchange3,
          b.rate3,
          COALESCE(p.rate1, 0) - COALESCE(h.rate2, 0) as rate_difference_paradex_hyperliquid,
          COALESCE(p.rate1, 0) - COALESCE(b.rate3, 0) as rate_difference_paradex_binance,
          COALESCE(h.rate2, 0) - COALESCE(b.rate3, 0) as rate_difference_hyperliquid_binance
        FROM time_series t
        LEFT JOIN paradex_data p ON t.time_point = p.time_point
        LEFT JOIN hyperliquid_data h ON t.time_point = h.time_point
        LEFT JOIN binance_data b ON t.time_point = b.time_point
        WHERE p.rate1 IS NOT NULL OR h.rate2 IS NOT NULL OR b.rate3 IS NOT NULL
        ORDER BY t.time_point ASC
      `;
    }
    
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
// 7. Получение топ-N арбитражных возможностей
router.get('/top-opportunities', async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    
    const query = `
      SELECT 
        a.symbol,
        o.exchange1,
        o.rate1,
        o.exchange2,
        o.rate2,
        o.rate_difference,
        o.annualized_return,
        o.recommended_strategy,
        o.created_at
      FROM funding_arbitrage_opportunities o
      JOIN assets a ON o.asset_id = a.id
      ORDER BY ABS(o.rate_difference) DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 8. Получение метаданных по активам
// 8. Получение метаданных по активам
router.get('/metadata/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const query = `
      WITH asset_data AS (
        SELECT id FROM assets WHERE symbol = $1
      )
      SELECT 
        a.symbol,
        -- Paradex метаданные
        pm.market,
        pm.base_currency,
        pm.quote_currency,
        pm.settlement_currency,
        pm.funding_period_hours,
        pm.max_funding_rate,
        pm.interest_rate,
        -- HyperLiquid метаданные
        hm.sz_decimals,
        hm.max_leverage,
        -- Binance метаданные
        bm.adjusted_funding_rate_cap,
        bm.adjusted_funding_rate_floor,
        bm.funding_interval_hours
      FROM assets a
      LEFT JOIN paradex_asset_metadata pm ON a.id = pm.asset_id
      LEFT JOIN hyperliquid_asset_metadata hm ON a.id = hm.asset_id
      LEFT JOIN binance_asset_metadata bm ON a.id = bm.asset_id
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

// Получение ставок фандинга со всех бирж для конкретного актива
router.get('/all-rates/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const query = `
      WITH asset_id AS (
        SELECT id FROM assets WHERE symbol = $1
      ),
      paradex_latest AS (
        SELECT 
          'Paradex' as exchange,
          funding_rate,
          created_at
        FROM paradex_funding_rates
        WHERE asset_id = (SELECT id FROM asset_id)
        ORDER BY created_at DESC
        LIMIT 1
      ),
      hyperliquid_latest AS (
        SELECT 
          'HyperLiquid' as exchange,
          funding_rate,
          created_at
        FROM hyperliquid_funding_rates
        WHERE asset_id = (SELECT id FROM asset_id)
        ORDER BY created_at DESC
        LIMIT 1
      ),
      binance_latest AS (
        SELECT 
          'Binance' as exchange,
          funding_rate,
          created_at
        FROM binance_funding_rates
        WHERE asset_id = (SELECT id FROM asset_id)
        ORDER BY created_at DESC
        LIMIT 1
      )
      SELECT * FROM (
        SELECT * FROM paradex_latest
        UNION ALL
        SELECT * FROM hyperliquid_latest
        UNION ALL
        SELECT * FROM binance_latest
      ) rates
      WHERE funding_rate IS NOT NULL
    `;
    
    const result = await db.query(query, [symbol]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No rates found for this asset' });
    }
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;