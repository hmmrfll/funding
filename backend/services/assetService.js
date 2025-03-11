// services/assetService.js
const db = require('../config/db');

class AssetService {
  async getAssetOrCreateBySymbol(symbol) {
    try {
      let asset = await db.query(
        'SELECT id FROM assets WHERE symbol = $1',
        [symbol]
      );
      
      if (asset.rows.length > 0) {
        return asset.rows[0].id;
      }
      
      // Создаем новый актив
      const newAsset = await db.query(
        'INSERT INTO assets (symbol, is_active) VALUES ($1, TRUE) RETURNING id',
        [symbol]
      );
      
      return newAsset.rows[0].id;
    } catch (error) {
      console.error(`Ошибка при получении/создании актива ${symbol}:`, error);
      throw error;
    }
  }
}

module.exports = new AssetService();