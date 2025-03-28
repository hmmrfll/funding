// services/fundingArbitrageService.js
const paradexTradingService = require('./paradexTradingService');
const hyperliquidTradingService = require('./hyperliquidTradingService');
const db = require('../config/db');

class FundingArbitrageService {
  async getArbitrageOpportunities(minDifference = 0.0005) {
    try {
      const query = `
        WITH latest_opportunities AS (
          SELECT 
            asset_id, 
            exchange1,
            exchange2,
            MAX(created_at) as max_created_at
          FROM funding_arbitrage_opportunities
          WHERE created_at > NOW() - INTERVAL '1 hour'
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
          o.recommended_strategy
        FROM funding_arbitrage_opportunities o
        JOIN latest_opportunities lo ON 
          o.asset_id = lo.asset_id AND 
          o.exchange1 = lo.exchange1 AND 
          o.exchange2 = lo.exchange2 AND 
          o.created_at = lo.max_created_at
        JOIN assets a ON o.asset_id = a.id
        WHERE ABS(o.rate_difference) >= $1
        ORDER BY ABS(o.rate_difference) DESC
      `;
      
      const result = await db.query(query, [minDifference]);
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении арбитражных возможностей:', error);
      throw error;
    }
  }

  async executeArbitrageStrategy(userId, opportunity, size) {
    try {
      // Определяем, на какой бирже long, а на какой short
      let longExchange, shortExchange, longSymbol, shortSymbol;
      
      if (opportunity.rate_difference > 0) {
        // Если rate1 > rate2, то short на exchange1 и long на exchange2
        longExchange = opportunity.exchange2;
        shortExchange = opportunity.exchange1;
      } else {
        // Если rate1 < rate2, то long на exchange1 и short на exchange2
        longExchange = opportunity.exchange1;
        shortExchange = opportunity.exchange2;
      }
      
      // Получаем символы для каждой биржи
      // Paradex использует формат BTC-USD-PERP, а HyperLiquid просто BTC
      longSymbol = this.getSymbolForExchange(opportunity.symbol, longExchange);
      shortSymbol = this.getSymbolForExchange(opportunity.symbol, shortExchange);
      
      // Исполняем ордера
      const longResult = await this.executeOrder(userId, longExchange, longSymbol, 'buy', size);
      const shortResult = await this.executeOrder(userId, shortExchange, shortSymbol, 'sell', size);
      
      return {
        long: {
          exchange: longExchange,
          symbol: longSymbol,
          result: longResult
        },
        short: {
          exchange: shortExchange,
          symbol: shortSymbol,
          result: shortResult
        }
      };
    } catch (error) {
      console.error('Ошибка при исполнении арбитражной стратегии:', error);
      throw error;
    }
  }

  async closeArbitragePositions(userId, strategy) {
    try {
      // Закрываем позиции на обеих биржах
      const longClose = await this.executeOrder(
        userId, 
        strategy.long.exchange, 
        strategy.long.symbol, 
        'sell', 
        null, // Размер не указан, закрываем всю позицию
        true  // reduceOnly
      );
      
      const shortClose = await this.executeOrder(
        userId, 
        strategy.short.exchange, 
        strategy.short.symbol, 
        'buy', 
        null, // Размер не указан, закрываем всю позицию
        true  // reduceOnly
      );
      
      return {
        long: {
          exchange: strategy.long.exchange,
          symbol: strategy.long.symbol,
          result: longClose
        },
        short: {
          exchange: strategy.short.exchange,
          symbol: strategy.short.symbol,
          result: shortClose
        }
      };
    } catch (error) {
      console.error('Ошибка при закрытии арбитражных позиций:', error);
      throw error;
    }
  }

  getSymbolForExchange(baseSymbol, exchange) {
    // Преобразуем базовый символ (например, BTC) в формат биржи
    if (exchange === 'Paradex') {
      return `${baseSymbol}-USD-PERP`;
    } else if (exchange === 'HyperLiquid') {
      return baseSymbol;
    }
    return baseSymbol;
  }

  async executeOrder(userId, exchange, symbol, side, size, reduceOnly = false) {
    if (exchange === 'Paradex') {
      return await paradexTradingService.openPosition(userId, symbol, side, size, null, reduceOnly);
    } else if (exchange === 'HyperLiquid') {
      return await hyperliquidTradingService.openPosition(userId, symbol, side, size, null, reduceOnly);
    }
    throw new Error(`Неизвестная биржа: ${exchange}`);
  }
}

module.exports = new FundingArbitrageService();