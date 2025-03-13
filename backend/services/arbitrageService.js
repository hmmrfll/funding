// services/arbitrageService.js
const db = require('../config/db');
// Удаляем импорты paradexService и hyperliquidService
// Добавляем импорт assetService
const assetService = require('./assetService');

class ArbitrageService {
  async calculateArbitrageOpportunities() {
    try {
      console.log('Расчет арбитражных возможностей...');
      
      // Получаем последние ставки фандинга со всех бирж
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
        ),
        binance_latest AS (
          SELECT 
            asset_id, 
            funding_rate,
            ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY created_at DESC) as rn
          FROM binance_funding_rates
        )
        SELECT 
          a.id as asset_id,
          a.symbol,
          p.funding_rate as paradex_rate,
          h.funding_rate as hyperliquid_rate,
          b.funding_rate as binance_rate
        FROM assets a
        LEFT JOIN paradex_latest p ON a.id = p.asset_id AND p.rn = 1
        LEFT JOIN hyperliquid_latest h ON a.id = h.asset_id AND h.rn = 1
        LEFT JOIN binance_latest b ON a.id = b.asset_id AND b.rn = 1
        WHERE a.is_active = TRUE
        AND (
          (p.funding_rate IS NOT NULL AND h.funding_rate IS NOT NULL) OR
          (p.funding_rate IS NOT NULL AND b.funding_rate IS NOT NULL) OR
          (h.funding_rate IS NOT NULL AND b.funding_rate IS NOT NULL)
        )
      `;
      
      const result = await db.query(query);
      
      // Сохраняем арбитражные возможности
      for (const row of result.rows) {
        // Находим все возможные пары бирж для арбитража
        if (row.paradex_rate !== null && row.hyperliquid_rate !== null) {
          const diff = row.paradex_rate - row.hyperliquid_rate;
          const strategy = diff > 0 
            ? 'Long on HyperLiquid, Short on Paradex' 
            : 'Long on Paradex, Short on HyperLiquid';
          
          await this.saveArbitrageOpportunity(
            row.asset_id, 
            'Paradex', 
            'HyperLiquid', 
            row.paradex_rate, 
            row.hyperliquid_rate, 
            diff, 
            diff * 3 * 365, 
            strategy
          );
        }
        
        if (row.paradex_rate !== null && row.binance_rate !== null) {
          const diff = row.paradex_rate - row.binance_rate;
          const strategy = diff > 0 
            ? 'Long on Binance, Short on Paradex' 
            : 'Long on Paradex, Short on Binance';
          
          await this.saveArbitrageOpportunity(
            row.asset_id, 
            'Paradex', 
            'Binance', 
            row.paradex_rate, 
            row.binance_rate, 
            diff, 
            diff * 3 * 365, 
            strategy
          );
        }
        
        if (row.hyperliquid_rate !== null && row.binance_rate !== null) {
          const diff = row.hyperliquid_rate - row.binance_rate;
          const strategy = diff > 0 
            ? 'Long on Binance, Short on HyperLiquid' 
            : 'Long on HyperLiquid, Short on Binance';
          
          await this.saveArbitrageOpportunity(
            row.asset_id, 
            'HyperLiquid', 
            'Binance', 
            row.hyperliquid_rate, 
            row.binance_rate, 
            diff, 
            diff * 3 * 365, 
            strategy
          );
        }
      }
      
      console.log(`Найдено ${result.rows.length} активов для арбитража`);
      return result.rows;
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
            MAX(created_at) as max_created_at
          FROM funding_arbitrage_opportunities
          GROUP BY asset_id
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