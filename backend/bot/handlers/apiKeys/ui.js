// handlers/apiKeys/ui.js
/**
 * Формирует основное меню выбора бирж
 */
function getExchangesMenuMarkup() {
    return {
      inline_keyboard: [
        [
          { text: 'Paradex', callback_data: 'api_keys_paradex' },
          { text: 'HyperLiquid', callback_data: 'api_keys_hyperliquid' }
        ],
        [{ text: '« Назад', callback_data: 'api_keys_back_to_main' }]
      ]
    };
  }
  
  /**
   * Формирует главное меню бота
   */
  function getMainMenuMarkup(siteUrl) {
    return {
      inline_keyboard: [
        [
          { text: '🌐 Перейти на сайт', url: siteUrl },
        ],
        [
          { text: '🔑 API keys', callback_data: 'api_keys_menu' }
        ]
      ]
    };
  }
  
  /**
   * Формирует меню управления ключами биржи
   */
  function getExchangeKeysMarkup(hasKeys, exchange) {
    const actionButtons = hasKeys ? 
      [
        { text: '🗑️ Удалить ключ', callback_data: `api_keys_delete_${exchange.toLowerCase()}` },
        { text: '🔄 Обновить ключ', callback_data: `api_keys_add_${exchange.toLowerCase()}` }
      ] : 
      [
        { text: '➕ Добавить ключ', callback_data: `api_keys_add_${exchange.toLowerCase()}` }
      ];
    
    return {
      inline_keyboard: [
        actionButtons,
        [{ text: '« Назад', callback_data: 'api_keys_back_to_exchanges' }]
      ]
    };
  }
  
  /**
   * Формирует меню подтверждения удаления ключа
   */
  function getDeleteConfirmMarkup(exchange) {
    return {
      inline_keyboard: [
        [
          { text: '✅ Да, удалить', callback_data: `api_keys_confirm_delete_${exchange.toLowerCase()}` },
          { text: '❌ Отмена', callback_data: 'api_keys_cancel_delete' }
        ]
      ]
    };
  }
  
  module.exports = {
    getExchangesMenuMarkup,
    getMainMenuMarkup,
    getExchangeKeysMarkup,
    getDeleteConfirmMarkup
  };