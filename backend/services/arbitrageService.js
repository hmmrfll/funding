// services/arbitrageService.js
const db = require('../config/db');
const assetService = require('./assetService');

class ArbitrageService {

  async calculateArbitrageOpportunities() {
    try {
      
      // Оптимизированный запрос для получения последних ставок
      const query = `
      WITH latest_rates AS (
        -- Paradex последние ставки
        SELECT 
          asset_id, 
          'Paradex' as exchange,
          funding_rate,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
        FROM paradex_funding_rates
        WHERE created_at > extract(epoch from now() - interval '1 day') * 1000
        UNION ALL
        -- HyperLiquid последние ставки
        SELECT 
          asset_id, 
          'HyperLiquid' as exchange,
          funding_rate,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
        FROM hyperliquid_funding_rates
        WHERE created_at > extract(epoch from now() - interval '1 day') * 1000
        UNION ALL
        -- Binance последние ставки
        SELECT 
          asset_id, 
          'Binance' as exchange,
          funding_rate,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
        FROM binance_funding_rates
        WHERE created_at > extract(epoch from now() - interval '1 day') * 1000
        UNION ALL
        -- Bybit последние ставки
        SELECT 
          asset_id, 
          'Bybit' as exchange,
          funding_rate,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
        FROM bybit_funding_rates
        WHERE created_at > extract(epoch from now() - interval '1 day') * 1000
        UNION ALL
        -- OKX последние ставки
        SELECT 
          asset_id, 
          'OKX' as exchange,
          funding_rate,
          ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
        FROM okx_funding_rates
        WHERE created_at > extract(epoch from now() - interval '1 day') * 1000
      )
      SELECT 
        a.id as asset_id,
        a.symbol,
        lr.exchange,
        lr.funding_rate
      FROM latest_rates lr
      JOIN assets a ON lr.asset_id = a.id
      WHERE lr.rn = 1 AND a.is_active = TRUE
      ORDER BY a.id, lr.exchange
      `;
      
      const result = await db.query(query);

      
      // Группируем ставки по активам
      const assetRates = new Map();
      for (const row of result.rows) {
        if (!assetRates.has(row.asset_id)) {
          assetRates.set(row.asset_id, {
            asset_id: row.asset_id,
            symbol: row.symbol,
            rates: new Map()
          });
        }
        
        const asset = assetRates.get(row.asset_id);
        asset.rates.set(row.exchange, row.funding_rate);
      }
      
      // Сохраняем арбитражные возможности
      let opportunitiesCount = 0;
      const exchangePairs = [
        ['Paradex', 'HyperLiquid'],
        ['Paradex', 'Binance'],
        ['Paradex', 'Bybit'],
        ['Paradex', 'OKX'],
        ['HyperLiquid', 'Binance'],
        ['HyperLiquid', 'Bybit'],
        ['HyperLiquid', 'OKX'],
        ['Binance', 'Bybit'],
        ['Binance', 'OKX'],
        ['Bybit', 'OKX']
      ];
      
      // Очищаем устаревшие возможности перед вставкой новых
      await db.query(`
        DELETE FROM funding_arbitrage_opportunities 
        WHERE created_at < NOW() - INTERVAL '6 hours'
      `);
      
      // Для каждого актива, проверяем все пары бирж
      for (const [, asset] of assetRates) {
        for (const [exchange1, exchange2] of exchangePairs) {
          if (asset.rates.has(exchange1) && asset.rates.has(exchange2)) {
            const rate1 = asset.rates.get(exchange1);
            const rate2 = asset.rates.get(exchange2);
            const diff = rate1 - rate2;
            const annualReturn = diff * 3 * 365; // Предполагаем 3 фандинга в день, 365 дней в году
            
            const strategy = diff > 0 
              ? `Long on ${exchange2}, Short on ${exchange1}` 
              : `Long on ${exchange1}, Short on ${exchange2}`;
            
            await this.saveArbitrageOpportunity(
              asset.asset_id,
              exchange1,
              exchange2,
              rate1,
              rate2,
              diff,
              annualReturn,
              strategy
            );
            
            opportunitiesCount++;
          }
        }
      }
      

      return opportunitiesCount;
    } catch (error) {
      console.error('Ошибка при расчете арбитражных возможностей:', error);
      throw error;
    }
  }
  
  // Вспомогательный метод для сохранения возможностей
  async saveArbitrageOpportunity(assetId, exchange1, exchange2, rate1, rate2, diff, annualReturn, strategy) {
    await db.query(
      `INSERT INTO funding_arbitrage_opportunities 
       (asset_id, exchange1, exchange2, rate1, rate2, rate_difference, annualized_return, recommended_strategy) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        assetId, 
        exchange1, 
        exchange2, 
        rate1, 
        rate2, 
        diff, 
        annualReturn, 
        strategy
      ]
    );
  }
  
  async getLatestOpportunities() {
    try {
      const query = `
        WITH latest_opportunities AS (
          SELECT 
            asset_id, 
            exchange1,
            exchange2,
            MAX(created_at) as max_created_at
          FROM funding_arbitrage_opportunities
          WHERE created_at > NOW() - INTERVAL '6 hours'
          GROUP BY asset_id, exchange1, exchange2
        )
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
        JOIN latest_opportunities lo ON 
          o.asset_id = lo.asset_id AND 
          o.exchange1 = lo.exchange1 AND 
          o.exchange2 = lo.exchange2 AND 
          o.created_at = lo.max_created_at
        JOIN assets a ON o.asset_id = a.id
        ORDER BY ABS(o.rate_difference) DESC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении последних арбитражных возможностей:', error);
      throw error;
    }
  }
}

module.exports = new ArbitrageService();