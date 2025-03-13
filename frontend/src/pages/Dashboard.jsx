// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://91.239.206.123:10902/api';
// const API_URL = 'http://localhost:8034/api';


const Dashboard = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'annualized_return', direction: 'desc' });
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Автоматическое обновление каждые 5 минут
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Attempting to fetch from:', `${API_URL}/opportunities`);
      const response = await axios.get(`${API_URL}/opportunities`);
      console.log('Response received:', response);
      setOpportunities(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response,
        request: err.request
      });
      setError('Failed to load data. Please check your API connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/update`);
      await fetchData();
    } catch (err) {
      setError('Failed to update data. Please try again later.');
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatPercent = (value) => {
    return (value * 100).toFixed(4) + '%';
  };

  const formatAnnualReturn = (value) => {
    return (value * 100).toFixed(2) + '%';
  };

  const getValueClass = (value) => {
    return parseFloat(value) > 0 ? 'positive' : parseFloat(value) < 0 ? 'negative' : '';
  };

  const sortedOpportunities = React.useMemo(() => {
    const sortableOpportunities = [...opportunities];
    if (sortConfig.key) {
      sortableOpportunities.sort((a, b) => {
        // Для символа (строки) используем сравнение строк
        if (sortConfig.key === 'symbol') {
          const valueA = a[sortConfig.key];
          const valueB = b[sortConfig.key];
          return sortConfig.direction === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        
        // Для числовых значений - всегда используем обычное сравнение без абсолютных значений
        const valueA = parseFloat(a[sortConfig.key]);
        const valueB = parseFloat(b[sortConfig.key]);
        
        // Если одно из значений NaN, считаем его "меньшим"
        if (isNaN(valueA)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (isNaN(valueB)) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Стандартное сравнение чисел
        return sortConfig.direction === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      });
    }
    return sortableOpportunities;
  }, [opportunities, sortConfig]);

  if (loading && opportunities.length === 0) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="dashboard-title">Arbitrage Opportunities</h2>
        <div>
          {lastUpdated && (
            <span style={{ marginRight: '15px', color: '#aaa', fontSize: '14px' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort('symbol')} style={{ cursor: 'pointer' }}>
              Symbol 
              <span className="sort-indicator">
                {sortConfig.key === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </span>
            </th>
            <th>Exchange 1</th>
            <th>Rate 1</th>
            <th>Exchange 2</th>
            <th>Rate 2</th>
            <th onClick={() => requestSort('rate_difference')} style={{ cursor: 'pointer' }}>
              Rate Difference
              <span className="sort-indicator">
                {sortConfig.key === 'rate_difference' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </span>
            </th>
            <th onClick={() => requestSort('annualized_return')} style={{ cursor: 'pointer' }}>
              Annualized Return
              <span className="sort-indicator">
                {sortConfig.key === 'annualized_return' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </span>
            </th>
            <th>Strategy</th>
          </tr>
        </thead>
        <tbody>
          {sortedOpportunities.map((opp, index) => (
            <tr key={`${opp.symbol}-${index}`}>
              <td>
                <Link to={`/asset/${opp.symbol}`}>
                  {opp.symbol}
                </Link>
              </td>
              <td>{opp.exchange1}</td>
              <td className={getValueClass(opp.rate1)}>{formatPercent(opp.rate1)}</td>
              <td>{opp.exchange2}</td>
              <td className={getValueClass(opp.rate2)}>{formatPercent(opp.rate2)}</td>
              <td className={getValueClass(opp.rate_difference)}>{formatPercent(opp.rate_difference)}</td>
              <td className={getValueClass(opp.annualized_return)}>{formatAnnualReturn(opp.annualized_return)}</td>
              <td>{opp.recommended_strategy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;