// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://91.239.206.123:10902/api';

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
        let valueA = parseFloat(a[sortConfig.key]);
        let valueB = parseFloat(b[sortConfig.key]);
        
        if (sortConfig.key === 'symbol') {
          valueA = a[sortConfig.key];
          valueB = b[sortConfig.key];
          return sortConfig.direction === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        
        if (sortConfig.key === 'rate_difference' || sortConfig.key === 'annualized_return') {
          valueA = Math.abs(valueA);
          valueB = Math.abs(valueB);
        }
        
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
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
            <th onClick={() => requestSort('paradex_rate')} style={{ cursor: 'pointer' }}>
              Paradex Rate
              <span className="sort-indicator">
                {sortConfig.key === 'paradex_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </span>
            </th>
            <th onClick={() => requestSort('hyperliquid_rate')} style={{ cursor: 'pointer' }}>
              HyperLiquid Rate
              <span className="sort-indicator">
                {sortConfig.key === 'hyperliquid_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </span>
            </th>
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
          {sortedOpportunities.map((opp) => (
            <tr key={opp.symbol}>
              <td>
                <Link to={`/asset/${opp.symbol}`}>
                  {opp.symbol}
                </Link>
              </td>
              <td className={getValueClass(opp.paradex_rate)}>{formatPercent(opp.paradex_rate)}</td>
              <td className={getValueClass(opp.hyperliquid_rate)}>{formatPercent(opp.hyperliquid_rate)}</td>
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