// services/arbitrageService.js
const db = require('../config/db');
// Удаляем импорты paradexService и hyperliquidService
// Добавляем импорт assetService
const assetService = require('./assetService');

class ArbitrageService {
  async calculateArbitrageOpportunities() {
    try {
      console.log('Расчет арбитражных возможностей...');
      
      // Получаем последние ставки фандинга с обеих бирж
      const query = `
        WITH paradex_latest AS (
          SELECT 
            asset_id, 
            funding_rate,
            ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
          FROM paradex_funding_rates
        ),
        hyperliquid_latest AS (
          SELECT 
            asset_id, 
            funding_rate,
            ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
          FROM hyperliquid_funding_rates
        )
        SELECT 
          a.id as asset_id,
          a.symbol,
          p.funding_rate as paradex_rate,
          h.funding_rate as hyperliquid_rate,
          (p.funding_rate - h.funding_rate) as rate_difference,
          (p.funding_rate - h.funding_rate) * 3 * 365 as annualized_return
        FROM assets a
        JOIN paradex_latest p ON a.id = p.asset_id AND p.rn = 1
        JOIN hyperliquid_latest h ON a.id = h.asset_id AND h.rn = 1
        WHERE a.is_active = TRUE
      `;
      
      const result = await db.query(query);
      
      // Сохраняем арбитражные возможности
      for (const row of result.rows) {
        const strategy = row.rate_difference > 0 
          ? 'Long on HyperLiquid, Short on Paradex' 
          : 'Long on Paradex, Short on HyperLiquid';
        
        await db.query(
          `INSERT INTO funding_arbitrage_opportunities 
           (asset_id, paradex_rate, hyperliquid_rate, rate_difference, annualized_return, recommended_strategy) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            row.asset_id, 
            row.paradex_rate, 
            row.hyperliquid_rate, 
            row.rate_difference, 
            row.annualized_return, 
            strategy
          ]
        );
      }
      
      console.log(`Найдено ${result.rows.length} арбитражных возможностей`);
      return result.rows;
    } catch (error) {
      console.error('Ошибка при расчете арбитражных возможностей:', error);
      throw error;
    }
  }
  
  async getLatestOpportunities() {
    try {
      const query = `
        WITH latest_opportunities AS (
          SELECT 
            asset_id, 
            MAX(created_at) as max_created_at
          FROM funding_arbitrage_opportunities
          GROUP BY asset_id
        )
        SELECT 
          a.symbol, 
          o.paradex_rate, 
          o.hyperliquid_rate, 
          o.rate_difference, 
          o.annualized_return, 
          o.recommended_strategy, 
          o.created_at
        FROM funding_arbitrage_opportunities o
        JOIN latest_opportunities lo ON o.asset_id = lo.asset_id AND o.created_at = lo.max_created_at
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
  
  // Метод getAssetOrCreateBySymbol удален и перенесен в assetService.js
}

module.exports = new ArbitrageService();