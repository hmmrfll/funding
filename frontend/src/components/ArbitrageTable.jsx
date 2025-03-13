import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPercent, formatAnnualReturn, getColorByValue } from '../utils/formatters';

const ArbitrageTable = ({ opportunities }) => {
  const [sortField, setSortField] = useState('annualized_return');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    if (sortField === 'rate_difference' || sortField === 'annualized_return') {
      valueA = Math.abs(parseFloat(valueA));
      valueB = Math.abs(parseFloat(valueB));
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('symbol')}>
              Symbol {sortField === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2">Exchange 1</th>
            <th className="px-4 py-2">Rate 1</th>
            <th className="px-4 py-2">Exchange 2</th>
            <th className="px-4 py-2">Rate 2</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('rate_difference')}>
              Rate Diff {sortField === 'rate_difference' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('annualized_return')}>
              Annual Return {sortField === 'annualized_return' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2">Strategy</th>
          </tr>
        </thead>
        <tbody>
          {sortedOpportunities.map((opportunity, index) => (
            <tr key={`${opportunity.symbol}-${index}`} className="hover:bg-gray-50">
              <td className="border px-4 py-2 font-medium">
                <Link to={`/asset/${opportunity.symbol}`} className="text-blue-600 hover:underline">
                  {opportunity.symbol}
                </Link>
              </td>
              <td className="border px-4 py-2">{opportunity.exchange1}</td>
              <td className="border px-4 py-2">{formatPercent(opportunity.rate1)}</td>
              <td className="border px-4 py-2">{opportunity.exchange2}</td>
              <td className="border px-4 py-2">{formatPercent(opportunity.rate2)}</td>
              <td className={`border px-4 py-2 ${getColorByValue(opportunity.rate_difference)}`}>
                {formatPercent(opportunity.rate_difference)}
              </td>
              <td className={`border px-4 py-2 ${getColorByValue(opportunity.annualized_return)}`}>
                {formatAnnualReturn(opportunity.annualized_return)}
              </td>
              <td className="border px-4 py-2">{opportunity.recommended_strategy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArbitrageTable;