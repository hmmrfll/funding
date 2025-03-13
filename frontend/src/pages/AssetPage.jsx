// src/pages/AssetPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://91.239.206.123:10902/api';
// const API_URL = 'http://localhost:8034/api';

const AssetPage = () => {
  const { symbol } = useParams();
  const [allRates, setAllRates] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExchanges, setSelectedExchanges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Обновим эндпоинт для получения всех доступных ставок фандинга для актива
        const [metadataRes, ratesRes] = await Promise.all([
          axios.get(`${API_URL}/metadata/${symbol}`),
          axios.get(`${API_URL}/all-rates/${symbol}`) 
        ]);
        
        setMetadata(metadataRes.data);
        setAllRates(ratesRes.data);
        
        // Установим выбранные биржи по умолчанию
        if (ratesRes.data && ratesRes.data.length > 0) {
          setSelectedExchanges(ratesRes.data.map(rate => rate.exchange).slice(0, 2));
        }
        
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
      
      {allRates && allRates.length > 0 && (
        <div className="card">
          <h2 className="card-title">Current Funding Rates</h2>
          
          {/* Селектор бирж для сравнения */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#aaa' }}>Select Exchanges to Compare</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {allRates.map(rate => (
                <label key={rate.exchange} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={selectedExchanges.includes(rate.exchange)}
                    onChange={() => {
                      if (selectedExchanges.includes(rate.exchange)) {
                        setSelectedExchanges(selectedExchanges.filter(ex => ex !== rate.exchange));
                      } else {
                        setSelectedExchanges([...selectedExchanges, rate.exchange]);
                      }
                    }}
                    style={{ marginRight: '5px' }}
                  />
                  {rate.exchange}
                </label>
              ))}
            </div>
          </div>
          
          <div className="stats-grid">
            {allRates.filter(rate => selectedExchanges.includes(rate.exchange)).map(rate => (
              <div key={rate.exchange} className="stats-card">
                <div className="stats-label">{rate.exchange} Rate</div>
                <div className={`stats-value ${getValueClass(rate.funding_rate)}`}>
                  {formatPercent(rate.funding_rate)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Показ разницы ставок, если выбрано 2 биржи */}
          {selectedExchanges.length === 2 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#aaa' }}>Arbitrage Opportunity</h3>
              
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-label">Rate Difference</div>
                  <div className={`stats-value ${getValueClass(
                    parseFloat(allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate) - 
                    parseFloat(allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate)
                  )}`}>
                    {formatPercent(
                      parseFloat(allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate) - 
                      parseFloat(allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate)
                    )}
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-label">Annualized Return</div>
                  <div className={`stats-value ${getValueClass(
                    (parseFloat(allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate) - 
                    parseFloat(allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate)) * 3 * 365
                  )}`}>
                    {formatPercent(
                      (parseFloat(allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate) - 
                      parseFloat(allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate)) * 3 * 365
                    )}
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-label">Recommended Strategy</div>
                  <div className="stats-value">
                    {parseFloat(allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate) > 
                     parseFloat(allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate)
                      ? `Long on ${selectedExchanges[1]}, Short on ${selectedExchanges[0]}`
                      : `Long on ${selectedExchanges[0]}, Short on ${selectedExchanges[1]}`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {metadata && (
        <div className="card">
          <h2 className="card-title">Asset Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#aaa' }}>Paradex Market Details</h3>
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
              
              {/* Binance метаданные */}
              {(metadata.adjusted_funding_rate_cap || metadata.adjusted_funding_rate_floor || metadata.funding_interval_hours) && (
                <>
                  <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: '20px', color: '#aaa' }}>Binance Parameters</h3>
                  <table>
                    <tbody>
                      {metadata.funding_interval_hours && (
                        <tr>
                          <td>Funding Interval</td>
                          <td>{metadata.funding_interval_hours} hours</td>
                        </tr>
                      )}
                      {metadata.adjusted_funding_rate_cap && (
                        <tr>
                          <td>Max Funding Rate</td>
                          <td>{formatPercent(metadata.adjusted_funding_rate_cap)}</td>
                        </tr>
                      )}
                      {metadata.adjusted_funding_rate_floor && (
                        <tr>
                          <td>Min Funding Rate</td>
                          <td>{formatPercent(metadata.adjusted_funding_rate_floor)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
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
                    <td>Interest Rate</td>
                    <td>{formatPercent(metadata.interest_rate)}</td>
                  </tr>
                </tbody>
              </table>
              
              <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: '20px', color: '#aaa' }}>HyperLiquid Parameters</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Max Leverage</td>
                    <td>{metadata.max_leverage ? `${metadata.max_leverage}x` : 'N/A'}</td>
                  </tr>
                  {metadata.sz_decimals !== undefined && (
                    <tr>
                      <td>Size Decimals</td>
                      <td>{metadata.sz_decimals}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* График исторических данных */}
      {allRates && allRates.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h2 className="card-title">Historical Funding Rates</h2>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>
            Coming soon: Chart with historical funding rates for {symbol}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
            <button 
              onClick={() => alert('Историческая функциональность будет добавлена в следующих обновлениях')}
              style={{
                background: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Load Historical Data
            </button>
          </div>
        </div>
      )}
      
      {/* Раздел торговой идеи */}
      {allRates && allRates.length > 0 && selectedExchanges.length === 2 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h2 className="card-title">Trading Insights</h2>
          
          <div style={{ padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px', marginBottom: '20px' }}>
            {(() => {
              const rate1 = parseFloat(allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate);
              const rate2 = parseFloat(allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate);
              const diff = rate1 - rate2;
              const annualReturn = diff * 3 * 365 * 100; // в процентах
              
              if (Math.abs(annualReturn) < 10) {
                return <p>Текущая разница в ставках фандинга между {selectedExchanges[0]} и {selectedExchanges[1]} невелика. Годовая доходность от арбитража составляет всего {annualReturn.toFixed(2)}%, что может быть недостаточно с учетом комиссий и рисков.</p>;
              } else if (Math.abs(annualReturn) < 30) {
                return <p>Есть умеренная возможность для фандинг-арбитража между {selectedExchanges[0]} и {selectedExchanges[1]}. При годовой доходности {annualReturn.toFixed(2)}% стратегия может быть прибыльной при эффективном управлении рисками.</p>;
              } else {
                return <p>Обнаружена значительная возможность для фандинг-арбитража! Разница в ставках фандинга между {selectedExchanges[0]} и {selectedExchanges[1]} дает потенциальную годовую доходность {annualReturn.toFixed(2)}%. Рекомендуется рассмотреть {rate1 > rate2 ? `длинную позицию на ${selectedExchanges[1]} и короткую на ${selectedExchanges[0]}` : `длинную позицию на ${selectedExchanges[0]} и короткую на ${selectedExchanges[1]}`}.</p>;
              }
            })()}
          </div>
          
          <div style={{ fontSize: '12px', color: '#888' }}>
            <p><strong>Примечание:</strong> Эта информация предоставляется только в образовательных целях и не является финансовым советом. Всегда проводите собственное исследование перед совершением любых торговых операций.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetPage;