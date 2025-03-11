import React from 'react';
import { Link } from 'react-router-dom';
import { formatPercent, formatAnnualReturn, getColorByValue } from '../utils/formatters';

const TopOpportunitiesCard = ({ opportunities }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Top Arbitrage Opportunities</h2>
      <div className="space-y-3">
        {opportunities.map((opportunity) => (
          <div key={opportunity.symbol} className="p-3 border rounded hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <Link to={`/asset/${opportunity.symbol}`} className="text-lg font-semibold text-blue-600 hover:underline">
                {opportunity.symbol}
              </Link>
              <span className={`font-bold ${getColorByValue(opportunity.annualized_return)}`}>
                {formatAnnualReturn(opportunity.annualized_return)}
              </span>
            </div>
            <div className="mt-1 text-sm">
              <span>Paradex: {formatPercent(opportunity.paradex_rate)}</span> | 
              <span> HyperLiquid: {formatPercent(opportunity.hyperliquid_rate)}</span>
            </div>
            <div className="mt-1 text-sm text-gray-700">
              Strategy: {opportunity.recommended_strategy}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link to="/" className="text-blue-600 hover:underline">View All Opportunities</Link>
      </div>
    </div>
  );
};

export default TopOpportunitiesCard;