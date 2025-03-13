// src/components/ExchangeSelector.jsx
import React from 'react';

const ExchangeSelector = ({ availableExchanges, selectedExchanges, onChange }) => {
  const handleExchangeToggle = (exchange) => {
    if (selectedExchanges.includes(exchange)) {
      onChange(selectedExchanges.filter(ex => ex !== exchange));
    } else {
      onChange([...selectedExchanges, exchange]);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-gray-500 text-sm mb-2">Select Exchanges to Compare</h3>
      <div className="flex flex-wrap gap-3">
        {availableExchanges.map(exchange => (
          <div key={exchange} className="flex items-center">
            <input
              type="checkbox"
              id={`exchange-${exchange}`}
              checked={selectedExchanges.includes(exchange)}
              onChange={() => handleExchangeToggle(exchange)}
              className="mr-2"
            />
            <label 
              htmlFor={`exchange-${exchange}`}
              className={`cursor-pointer py-1 px-3 rounded ${
                selectedExchanges.includes(exchange)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {exchange}
            </label>
          </div>
        ))}
      </div>
      {selectedExchanges.length > 2 && (
        <p className="text-yellow-500 mt-2 text-sm">
          Для сравнения арбитражных возможностей рекомендуется выбрать 2 биржи
        </p>
      )}
    </div>
  );
};

export default ExchangeSelector;