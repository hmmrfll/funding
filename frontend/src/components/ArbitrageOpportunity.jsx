// src/components/ArbitrageOpportunity.jsx
import React from 'react';
import { formatPercent, formatAnnualReturn, getColorByValue } from '../utils/formatters';

const ArbitrageOpportunity = ({ exchange1, rate1, exchange2, rate2 }) => {
  // Расчет разницы ставок и годовой доходности
  const rateDifference = rate1 - rate2;
  const annualizedReturn = rateDifference * 3 * 365; // Предполагаем фандинг каждые 8 часов (3 раза в день)
  
  // Определение рекомендуемой стратегии
  const strategy = rateDifference > 0 
    ? `Long on ${exchange2}, Short on ${exchange1}` 
    : `Long on ${exchange1}, Short on ${exchange2}`;

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <h3 className="text-lg font-bold mb-3">Arbitrage Opportunity</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-500">{exchange1} Rate</div>
          <div className={`text-lg font-semibold ${getColorByValue(rate1)}`}>
            {formatPercent(rate1)}
          </div>
        </div>
        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-500">{exchange2} Rate</div>
          <div className={`text-lg font-semibold ${getColorByValue(rate2)}`}>
            {formatPercent(rate2)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-500">Rate Difference</div>
          <div className={`text-lg font-semibold ${getColorByValue(rateDifference)}`}>
            {formatPercent(rateDifference)}
          </div>
        </div>
        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-500">Annualized Return</div>
          <div className={`text-lg font-semibold ${getColorByValue(annualizedReturn)}`}>
            {formatAnnualReturn(annualizedReturn)}
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
        <div className="text-sm text-gray-500">Recommended Strategy</div>
        <div className="text-lg font-semibold text-blue-800">{strategy}</div>
      </div>
    </div>
  );
};

export default ArbitrageOpportunity;