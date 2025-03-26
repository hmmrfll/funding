// src/pages/AssetPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL;




const AssetPage = () => {
  const { symbol } = useParams();
  const [searchParams] = useSearchParams();
  const preferredExchange = searchParams.get('exchange');
  const lastSelectedExchange = localStorage.getItem('lastSelectedExchange');
  const effectiveExchange = preferredExchange || lastSelectedExchange;

  const [allRates, setAllRates] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExchanges, setSelectedExchanges] = useState(['Paradex']);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Загружаем метаданные и текущие ставки
        const [metadataRes, ratesRes, opportunitiesRes] = await Promise.all([
          axios.get(`${API_URL}/metadata/${symbol}`),
          axios.get(`${API_URL}/all-rates/${symbol}`),
          axios.get(`${API_URL}/opportunities`) // Получаем все арбитражные возможности
        ]);
        
        setMetadata(metadataRes.data);
        setAllRates(ratesRes.data);
        
        if (ratesRes.data && ratesRes.data.length > 0) {
          // Проверяем наличие Paradex и предпочтительной биржи
          const paradexAvailable = ratesRes.data.some(rate => rate.exchange === 'Paradex');
          const preferredAvailable = preferredExchange && ratesRes.data.some(rate => rate.exchange === preferredExchange);
          
          // Если есть предпочтительная биржа из URL и она доступна вместе с Paradex
          if (paradexAvailable && preferredAvailable) {

            setSelectedExchanges(['Paradex', preferredExchange]);
          } else {
            // Если нет предпочтения или оно недоступно, ищем сохраненную пару
            const savedComparisonExchange = localStorage.getItem('defaultComparisonExchange');
            const savedExchangeAvailable = savedComparisonExchange && 
                                          savedComparisonExchange !== 'all' && 
                                          ratesRes.data.some(rate => rate.exchange === savedComparisonExchange);
            
            if (paradexAvailable && savedExchangeAvailable) {

              setSelectedExchanges(['Paradex', savedComparisonExchange]);
            } else {
              // Если нет сохраненных настроек, ищем лучшую арбитражную возможность
              const symbolOpportunities = opportunitiesRes.data.filter(opp => opp.symbol === symbol);
              
              if (symbolOpportunities.length > 0) {
                // Сортируем по абсолютному значению разницы ставок
                symbolOpportunities.sort((a, b) => 
                  Math.abs(parseFloat(b.rate_difference)) - Math.abs(parseFloat(a.rate_difference))
                );
                
                const bestOpportunity = symbolOpportunities[0];

                
                setSelectedExchanges([bestOpportunity.exchange1, bestOpportunity.exchange2]);
              } else {
                // Если нет арбитражных возможностей, используем логику по умолчанию
                if (paradexAvailable) {
                  setSelectedExchanges(['Paradex']);
                  
                  // Если есть другие биржи, выбираем первую
                  const otherExchange = ratesRes.data.find(rate => rate.exchange !== 'Paradex');
                  if (otherExchange) {
                    setSelectedExchanges(['Paradex', otherExchange.exchange]);
                  }
                } else if (ratesRes.data.length >= 1) {
                  // Если нет Paradex, берем первую доступную биржу
                  setSelectedExchanges([ratesRes.data[0].exchange]);
                }
              }
            }
          }
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
  }, [symbol, preferredExchange]);

  const handleExchangeToggle = (exchange) => {
    if (selectedExchanges.includes(exchange)) {
      // Удаляем биржу из выбранных, но не удаляем если осталась последняя
      if (selectedExchanges.length > 1) {
        setSelectedExchanges(selectedExchanges.filter(ex => ex !== exchange));
      }
    } else {
      // Добавляем биржу в выбранные, максимум 2
      if (selectedExchanges.length < 2) {
        setSelectedExchanges([...selectedExchanges, exchange]);
      } else {
        // Заменяем вторую биржу новой
        setSelectedExchanges([selectedExchanges[0], exchange]);
      }
    }
  };

  // Форматирование процентов
  const formatPercent = (value) => {
    return value ? (parseFloat(value) * 100).toFixed(4) + '%' : 'N/A';
  };

  // Определение класса для значений
  const getValueClass = (value) => {
    if (!value) return '';
    return parseFloat(value) > 0 ? 'positive' : parseFloat(value) < 0 ? 'negative' : '';
  };

  if (loading) {
    return <div className="loading">Loading asset data...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="error">{error}</div>
        <Link to="/" className="back-link">Back to Dashboard</Link>
      </div>
    );
  }

  // Расчет арбитражной возможности, если выбрано 2 биржи
  const arbitrageOpportunity = selectedExchanges.length === 2 && allRates 
    ? (() => {
        const rate1 = allRates.find(r => r.exchange === selectedExchanges[0])?.funding_rate;
        const rate2 = allRates.find(r => r.exchange === selectedExchanges[1])?.funding_rate;
        
        if (!rate1 || !rate2) return null;
        
        const rateDiff = parseFloat(rate1) - parseFloat(rate2);
        const annualReturn = rateDiff * 3 * 365; // 3 раза в день, 365 дней
        const strategy = rateDiff > 0 
          ? `Long on ${selectedExchanges[1]}, Short on ${selectedExchanges[0]}` 
          : `Long on ${selectedExchanges[0]}, Short on ${selectedExchanges[1]}`;
        
        return { rateDiff, annualReturn, strategy };
      })()
    : null;

  return (
    <div>
      <Link 
        to="/" 
        className="back-link"
        onClick={() => {
          // Сохраняем позицию скролла для восстановления при возврате
          localStorage.setItem('scrollPosition', '0');
        }}
      >
        Back to Dashboard
      </Link>
      
      <h1 className="dashboard-title">{symbol} Funding Details</h1>
      
      {/* Индикатор текущей пары бирж */}
      {selectedExchanges.length === 2 && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#aaa' }}>
          Viewing arbitrage opportunity: {selectedExchanges[0]} - {selectedExchanges[1]}
        </div>
      )}
      
      {/* Карточки с текущими ставками */}
      {allRates && allRates.length > 0 && (
        <div className="card">
          <h2 className="card-title">Current Funding Rates</h2>
          
          {/* Селектор бирж для сравнения */}
          <div style={{ marginBottom: '20px' }}>
            <span className="filter-label">Select Exchanges to Compare (max 2)</span>
            <div className="filter-group">
              {allRates.map(rate => (
                <button
                  key={rate.exchange}
                  onClick={() => handleExchangeToggle(rate.exchange)}
                  className={`btn btn-secondary ${selectedExchanges.includes(rate.exchange) ? 'active' : ''}`}
                >
                  {rate.exchange}
                </button>
              ))}
            </div>
          </div>
          
          <div className="stats-grid">
            {selectedExchanges.map(exchange => {
              const rateData = allRates.find(rate => rate.exchange === exchange);
              if (!rateData) return null;
              
              return (
                <div key={exchange} className="stats-card">
                  <div className="stats-label">{exchange} Rate</div>
                  <div className={`stats-value ${getValueClass(rateData.funding_rate)}`}>
                    {formatPercent(rateData.funding_rate)}
                  </div>
                </div>
              );
            })}
            
            {/* Показываем арбитражную возможность, если выбрано 2 биржи */}
            {arbitrageOpportunity && (
              <>
                <div className="stats-card">
                  <div className="stats-label">Rate Difference</div>
                  <div className={`stats-value ${getValueClass(arbitrageOpportunity.rateDiff)}`}>
                    {formatPercent(arbitrageOpportunity.rateDiff)}
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-label">Annual Return</div>
                  <div className={`stats-value ${getValueClass(arbitrageOpportunity.annualReturn)}`}>
                    {formatPercent(arbitrageOpportunity.annualReturn)}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Рекомендуемая стратегия */}
          {arbitrageOpportunity && (
            <div className="strategy-box">
              <div className="strategy-title">Recommended Strategy</div>
              <div className="strategy-value">
                {arbitrageOpportunity.strategy}
              </div>
              
              <div className="strategy-desc">
                {Math.abs(arbitrageOpportunity.annualReturn) > 0.1 
                  ? `This strategy could yield approximately ${formatPercent(arbitrageOpportunity.annualReturn)} annually based on current rates.`
                  : 'The current rate difference is too small for effective arbitrage.'}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Информация об активе */}
      {metadata && (
        <div className="card">
          <h2 className="card-title">Asset Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <h3 className="section-title">Paradex Market Details</h3>
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
                  <tr>
                    <td>Funding Period</td>
                    <td>{metadata.funding_period_hours ? `${metadata.funding_period_hours} hours` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Max Funding Rate</td>
                    <td>{formatPercent(metadata.max_funding_rate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="section-title">Exchange Parameters</h3>
              
              {/* HyperLiquid Parameters */}
              {(metadata.max_leverage || metadata.sz_decimals) && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{fontSize: '14px', color: '#2196f3', marginBottom: '5px'}}>HyperLiquid</h4>
                  <table style={{marginBottom: '15px'}}>
                    <tbody>
                      {metadata.max_leverage && (
                        <tr>
                          <td>Max Leverage</td>
                          <td>{metadata.max_leverage}x</td>
                        </tr>
                      )}
                      {metadata.sz_decimals !== undefined && (
                        <tr>
                          <td>Size Decimals</td>
                          <td>{metadata.sz_decimals}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Binance Parameters */}
              {(metadata.adjusted_funding_rate_cap || metadata.adjusted_funding_rate_floor || metadata.funding_interval_hours) && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{fontSize: '14px', color: '#f0b90b', marginBottom: '5px'}}>Binance</h4>
                  <table style={{marginBottom: '15px'}}>
                    <tbody>
                      {metadata.funding_interval_hours && (
                        <tr>
                          <td>Funding Interval</td>
                          <td>{metadata.funding_interval_hours} hours</td>
                        </tr>
                      )}
                      {metadata.adjusted_funding_rate_cap && (
                        <tr>
                          <td>Max Rate</td>
                          <td>{formatPercent(metadata.adjusted_funding_rate_cap)}</td>
                        </tr>
                      )}
                      {metadata.adjusted_funding_rate_floor && (
                        <tr>
                          <td>Min Rate</td>
                          <td>{formatPercent(metadata.adjusted_funding_rate_floor)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Bybit Parameters */}
              {metadata.bybit_category && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{fontSize: '14px', color: '#f7a600', marginBottom: '5px'}}>Bybit</h4>
                  <table style={{marginBottom: '15px'}}>
                    <tbody>
                      <tr>
                        <td>Category</td>
                        <td>{metadata.bybit_category}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* OKX Parameters */}
              {metadata.okx_inst_id && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{fontSize: '14px', color: '#1e88e5', marginBottom: '5px'}}>OKX</h4>
                  <table style={{marginBottom: '15px'}}>
                    <tbody>
                      <tr>
                        <td>Instrument ID</td>
                        <td>{metadata.okx_inst_id}</td>
                      </tr>
                      {metadata.okx_min_funding_rate && (
                        <tr>
                          <td>Min Rate</td>
                          <td>{formatPercent(metadata.okx_min_funding_rate)}</td>
                        </tr>
                      )}
                      {metadata.okx_max_funding_rate && (
                        <tr>
                          <td>Max Rate</td>
                          <td>{formatPercent(metadata.okx_max_funding_rate)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
      
      {/* Торговые рекомендации */}
      {arbitrageOpportunity && (
        <div className="card">
          <h2 className="card-title">Trading Insights</h2>
          
          <div style={{
            padding: '15px',
            background: 'var(--bg-secondary)',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            {(() => {
              const absReturn = Math.abs(arbitrageOpportunity.annualReturn);
              
              if (absReturn < 0.1) {
                return <p>The current difference in funding rates between {selectedExchanges[0]} and {selectedExchanges[1]} is minimal. The annualized return from arbitrage is only {formatPercent(arbitrageOpportunity.annualReturn)}, which may not be sufficient considering fees and risks.</p>;
              } else if (absReturn < 0.3) {
                return <p>There is a moderate opportunity for funding arbitrage between {selectedExchanges[0]} and {selectedExchanges[1]}. With an annualized return of {formatPercent(arbitrageOpportunity.annualReturn)}, the strategy could be profitable with effective risk management.</p>;
              } else {
                return <p>A significant funding arbitrage opportunity has been detected! The difference in funding rates between {selectedExchanges[0]} and {selectedExchanges[1]} provides a potential annualized return of {formatPercent(arbitrageOpportunity.annualReturn)}. Consider {arbitrageOpportunity.strategy}.</p>;
              }
            })()}
          </div>
          
          <div style={{fontSize: '12px', color: '#888'}}>
            <p><strong>Note:</strong> This information is provided for educational purposes only and is not financial advice. Always conduct your own research before making any trading decisions.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetPage;