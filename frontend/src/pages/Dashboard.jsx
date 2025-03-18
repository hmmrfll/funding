// src/pages/Dashboard.jsx (с изменениями)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import FilterBar from '../components/FilterBar'; // Импортируем наш новый компонент
import { FiRefreshCw } from 'react-icons/fi'; // Библиотека иконок

// const API_URL = 'http://91.239.206.123:10902/api';
// const API_URL = 'http://localhost:8034/api';
const API_URL = 'https://api.hedgie.online/api';

// Предполагаемые списки монет для фильтров MAX XP (пример)
// В реальной имплементации эти данные должны приходить с API
const NEW_COINS = ['KAITO', 'IP', 'RED', 'RAY', 'OM', 'ELX'];
const LOW_OI_THRESHOLD = 150000; // 150k USD
const LOW_VOLUME_THRESHOLD = 500000; // 500k USD

const Dashboard = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'annualized_return', direction: 'desc' });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [returnTypeFilter, setReturnTypeFilter] = useState('all');
  const [defaultComparisonExchange, setDefaultComparisonExchange] = useState('all');
  const [availableExchanges, setAvailableExchanges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxXpFilter, setMaxXpFilter] = useState('none');
  const [assetMetrics, setAssetMetrics] = useState({});

  // Загрузка данных о метриках активов
  useEffect(() => {
    const fetchAssetMetrics = async () => {
      try {
        const response = await axios.get(`${API_URL}/asset-metrics`);
        setAssetMetrics(response.data);
      } catch (err) {
        console.error('Error fetching asset metrics:', err);
        setAssetMetrics({});
      }
    };
    
    fetchAssetMetrics();
    
    const intervalId = setInterval(fetchAssetMetrics, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Загрузка сохраненных настроек
  useEffect(() => {
    const savedExchange = localStorage.getItem('defaultComparisonExchange');
    const savedReturnType = localStorage.getItem('returnTypeFilter');
    const savedSortConfig = JSON.parse(localStorage.getItem('sortConfig'));
    const savedScrollPosition = localStorage.getItem('scrollPosition');
    const savedSearchQuery = localStorage.getItem('searchQuery');
    const savedMaxXpFilter = localStorage.getItem('maxXpFilter');
    
    if (savedExchange) setDefaultComparisonExchange(savedExchange);
    if (savedReturnType) setReturnTypeFilter(savedReturnType);
    if (savedSortConfig) setSortConfig(savedSortConfig);
    if (savedSearchQuery) setSearchQuery(savedSearchQuery);
    if (savedMaxXpFilter) setMaxXpFilter(savedMaxXpFilter);
    
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
      }, 100);
    }
  }, []);

  // Сохранение настроек при их изменении
  useEffect(() => {
    localStorage.setItem('defaultComparisonExchange', defaultComparisonExchange);
    localStorage.setItem('returnTypeFilter', returnTypeFilter);
    localStorage.setItem('sortConfig', JSON.stringify(sortConfig));
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('maxXpFilter', maxXpFilter);
  }, [defaultComparisonExchange, returnTypeFilter, sortConfig, searchQuery, maxXpFilter]);

  // Сохранение позиции прокрутки
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('scrollPosition', window.scrollY.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Динамическое обновление списка доступных бирж
  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      const uniqueExchanges = [...new Set(
        opportunities
          .filter(opp => opp.exchange1 === 'Paradex' || opp.exchange2 === 'Paradex')
          .map(opp => opp.exchange1 === 'Paradex' ? opp.exchange2 : opp.exchange1)
      )];
      
      if (uniqueExchanges.length > 0) {
        setAvailableExchanges(uniqueExchanges);
      }
    }
  }, [opportunities]);

  useEffect(() => {
    fetchData();
    
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/opportunities`);
      
      const paradexOpportunities = response.data.filter(opp => 
        (opp.exchange1 === 'Paradex' || opp.exchange2 === 'Paradex') &&
        opp.exchange1 !== 'DYDX' && opp.exchange2 !== 'DYDX'
      );
      
      setOpportunities(paradexOpportunities);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
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
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value) => {
    return (value * 100).toFixed(4) + '%';
  };

  const formatAnnualReturn = (value) => {
    return (value * 100).toFixed(2) + '%';
  };
  
  const formatDollars = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getValueClass = (value) => {
    return parseFloat(value) > 0 ? 'positive' : parseFloat(value) < 0 ? 'negative' : '';
  };

  // Фильтрация и сортировка возможностей
  const filteredOpportunities = React.useMemo(() => {
    let filtered = [...opportunities];
    
    if (filtered.length === 0) {
      return [];
    }
    
    // Фильтрация по выбранной бирже
    if (defaultComparisonExchange !== 'all') {
      filtered = filtered.filter(opp => 
        (opp.exchange1 === 'Paradex' && opp.exchange2 === defaultComparisonExchange) || 
        (opp.exchange1 === defaultComparisonExchange && opp.exchange2 === 'Paradex')
      );
    }
    
    // Фильтрация по типу доходности
    if (returnTypeFilter === 'positive') {
      filtered = filtered.filter(opp => parseFloat(opp.annualized_return) > 0);
    } else if (returnTypeFilter === 'negative') {
      filtered = filtered.filter(opp => parseFloat(opp.annualized_return) < 0);
    }

    // Поиск по тикеру
    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(opp => 
        opp.symbol.toLowerCase().includes(query)
      );
    }
    
    // Фильтры MAX XP
    if (maxXpFilter !== 'none' && Object.keys(assetMetrics).length > 0) {
      filtered = filtered.filter(opp => {
        const metrics = assetMetrics[opp.symbol];
        if (!metrics) return false;
        
        switch (maxXpFilter) {
          case 'new':
            return metrics.isNew;
          case 'lowOi':
            return metrics.hasLowOi;
          case 'lowVolume':
            return metrics.hasLowVolume;
          default:
            return true;
        }
      });
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      if (sortConfig.key === 'symbol') {
        return sortConfig.direction === 'asc' 
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }
      
      const valueA = parseFloat(a[sortConfig.key]);
      const valueB = parseFloat(b[sortConfig.key]);
      
      if (returnTypeFilter === 'absolute' && (sortConfig.key === 'rate_difference' || sortConfig.key === 'annualized_return')) {
        return sortConfig.direction === 'asc' 
          ? Math.abs(valueA) - Math.abs(valueB) 
          : Math.abs(valueB) - Math.abs(valueA);
      } else {
        return sortConfig.direction === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      }
    });
    
    return filtered;
  }, [opportunities, defaultComparisonExchange, returnTypeFilter, sortConfig, searchQuery, maxXpFilter, assetMetrics]);

  if (loading && opportunities.length === 0) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">Funding Arbitrage Dashboard</h2>
        <div className="dashboard-actions">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={handleRefresh} className="btn refresh-btn" disabled={loading}>
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            {loading ? 'Refreshing' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {/* Заменяем старый блок фильтров на новый компонент */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        defaultComparisonExchange={defaultComparisonExchange}
        setDefaultComparisonExchange={setDefaultComparisonExchange}
        availableExchanges={availableExchanges}
        maxXpFilter={maxXpFilter}
        setMaxXpFilter={setMaxXpFilter}
        returnTypeFilter={returnTypeFilter}
        setReturnTypeFilter={setReturnTypeFilter}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        LOW_OI_THRESHOLD={LOW_OI_THRESHOLD}
        LOW_VOLUME_THRESHOLD={LOW_VOLUME_THRESHOLD}
        formatDollars={formatDollars}
      />
      
      {/* Статистика */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-label">Total Opportunities</div>
          <div className="stats-value">{filteredOpportunities.length}</div>
        </div>
        
        <div className="stats-card">
          <div className="stats-label">Average Annual Return</div>
          <div className={`stats-value ${getValueClass(
            filteredOpportunities.length > 0 
              ? filteredOpportunities.reduce((sum, opp) => sum + parseFloat(opp.annualized_return), 0) / filteredOpportunities.length
              : 0
          )}`}>
            {filteredOpportunities.length > 0 
              ? formatAnnualReturn(filteredOpportunities.reduce((sum, opp) => sum + parseFloat(opp.annualized_return), 0) / filteredOpportunities.length)
              : 'N/A'}
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-label">Best Opportunity</div>
          <div className="stats-value positive">
            {filteredOpportunities.length > 0 
              ? formatAnnualReturn(Math.max(...filteredOpportunities.map(o => parseFloat(o.annualized_return))))
              : 'N/A'}
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-label">Worst Opportunity</div>
          <div className="stats-value negative">
            {filteredOpportunities.length > 0 
              ? formatAnnualReturn(Math.min(...filteredOpportunities.map(o => parseFloat(o.annualized_return))))
              : 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Таблица возможностей */}
      <table>
        <thead>
          <tr>
            <th onClick={() => setSortConfig({ key: 'symbol', direction: sortConfig.key === 'symbol' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
              Symbol {sortConfig.key === 'symbol' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
            </th>
            <th>Paradex Rate</th>
            <th>Other Exchange</th> 
            <th>Other Rate</th>
            <th onClick={() => setSortConfig({ key: 'rate_difference', direction: sortConfig.key === 'rate_difference' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
              Rate Diff {sortConfig.key === 'rate_difference' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
            </th>
            <th onClick={() => setSortConfig({ key: 'annualized_return', direction: sortConfig.key === 'annualized_return' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
              Annual Ret {sortConfig.key === 'annualized_return' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
            </th>
            <th>Strategy</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredOpportunities.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-results">
                No matching opportunities found
              </td>
            </tr>
          ) : (
            filteredOpportunities.map((opp, index) => {
              // Определяем, где Paradex и другая биржа
              const isParadexFirst = opp.exchange1 === 'Paradex';
              const paradexRate = isParadexFirst ? opp.rate1 : opp.rate2;
              const otherExchange = isParadexFirst ? opp.exchange2 : opp.exchange1;
              const otherRate = isParadexFirst ? opp.rate2 : opp.rate1;
              
              // Создаем краткую стратегию
              const shortStrategy = (() => {
                const diff = parseFloat(opp.rate_difference);
                if (diff > 0) {
                  return `Long ${otherExchange}, Short Paradex`;
                } else {
                  return `Long Paradex, Short ${otherExchange}`;
                }
              })();
              
              // Получаем метрики для отображения в подсказке
              const metrics = assetMetrics[opp.symbol];
              const metricsTooltip = metrics ? 
                `OI: ${formatDollars(metrics.openInterest)}\nVolume: ${formatDollars(metrics.volume)}\n${metrics.isNew ? 'New Coin' : ''}` : 
                '';
              
              // Символы для индикации типа MAX XP
              const maxXpIndicator = (() => {
                if (!metrics) return '';
                
                let indicators = [];
                if (metrics.isNew) indicators.push('🆕');
                if (metrics.hasLowOi) indicators.push('💰');
                if (metrics.hasLowVolume) indicators.push('📊');
                
                return indicators.join(' ');
              })();
              
              return (
                <tr key={`${opp.symbol}-${index}`}>
                  <td>
                    <Link to={`/asset/${opp.symbol}`} className="symbol-link">
                      {opp.symbol}
                    </Link>
                    {maxXpIndicator && (
                      <span 
                        title={metricsTooltip}
                        className="max-xp-indicator"
                      >
                        {maxXpIndicator}
                      </span>
                    )}
                  </td>
                  <td className={getValueClass(paradexRate)}>{formatPercent(paradexRate)}</td>
                  <td>{otherExchange}</td>
                  <td className={getValueClass(otherRate)}>{formatPercent(otherRate)}</td>
                  <td className={getValueClass(opp.rate_difference)}>
                    <span className="bold-value">{formatPercent(opp.rate_difference)}</span>
                  </td>
                  <td className={getValueClass(opp.annualized_return)}>
                    <span className="bold-value">{formatAnnualReturn(opp.annualized_return)}</span>
                  </td>
                  <td>
                    <span className={getValueClass(opp.rate_difference)}>{shortStrategy}</span>
                  </td>
                  <td>
                    <Link 
                      to={`/asset/${opp.symbol}?exchange=${otherExchange}`} 
                      className="action-link"
                      onClick={() => {
                        localStorage.setItem('scrollPosition', window.scrollY.toString());
                        if (defaultComparisonExchange !== 'all') {
                          localStorage.setItem('lastSelectedExchange', defaultComparisonExchange);
                        } else {
                          localStorage.setItem('lastSelectedExchange', otherExchange);
                        }
                      }}
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;