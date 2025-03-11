// src/pages/AssetPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8034/api';

const AssetPage = () => {
  const { symbol } = useParams();
  const [assetData, setAssetData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metadataRes, ratesRes] = await Promise.all([
          axios.get(`${API_URL}/metadata/${symbol}`),
          axios.get(`${API_URL}/rates/${symbol}`)
        ]);
        
        setMetadata(metadataRes.data);
        setRates(ratesRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data for ${symbol}. It may not exist or there may be a connection issue.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return <div className="loading">Loading asset data...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="error">{error}</div>
        <Link to="/">← Back to Dashboard</Link>
      </div>
    );
  }

  // Форматирование процентов
  const formatPercent = (value) => {
    return value ? (parseFloat(value) * 100).toFixed(4) + '%' : 'N/A';
  };

  // Определение класса для значений
  const getValueClass = (value) => {
    if (!value) return '';
    return parseFloat(value) > 0 ? 'positive' : parseFloat(value) < 0 ? 'negative' : '';
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/">← Back to Dashboard</Link>
      </div>
      
      <h1 className="dashboard-title">{symbol} Funding Details</h1>
      
      {rates && (
        <div className="card">
          <h2 className="card-title">Current Funding Rates</h2>
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-label">Paradex Rate</div>
              <div className={`stats-value ${getValueClass(rates.paradex_rate)}`}>
                {formatPercent(rates.paradex_rate)}
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-label">HyperLiquid Rate</div>
              <div className={`stats-value ${getValueClass(rates.hyperliquid_rate)}`}>
                {formatPercent(rates.hyperliquid_rate)}
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-label">Rate Difference</div>
              <div className={`stats-value ${getValueClass(rates.rate_difference)}`}>
                {formatPercent(rates.rate_difference)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {metadata && (
        <div className="card">
          <h2 className="card-title">Asset Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#aaa' }}>Market Details</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Market</td>
                    <td>{metadata.market || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Base Currency</td>
                    <td>{metadata.base_currency || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Quote Currency</td>
                    <td>{metadata.quote_currency || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Settlement Currency</td>
                    <td>{metadata.settlement_currency || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#aaa' }}>Funding Parameters</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Funding Period</td>
                    <td>{metadata.funding_period_hours ? `${metadata.funding_period_hours} hours` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Max Funding Rate</td>
                    <td>{formatPercent(metadata.max_funding_rate)}</td>
                  </tr>
                  <tr>
                    <td>Max Leverage</td>
                    <td>{metadata.max_leverage ? `${metadata.max_leverage}x` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Interest Rate</td>
                    <td>{formatPercent(metadata.interest_rate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Здесь в будущем можно добавить график с историческими данными */}
    </div>
  );
};

export default AssetPage;