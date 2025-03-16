// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// API URL - можно вынести в конфигурационный файл
const API_URL = 'http://localhost:8034/api';

const Dashboard = () => {
  // Состояния для данных
  const [opportunities, setOpportunities] = useState([]);
  const [assetMetrics, setAssetMetrics] = useState({});
  const [maxXpSettings, setMaxXpSettings] = useState({
    newCoins: [],
    lowOiThreshold: 150000,
    lowVolumeThreshold: 500000
  });
  
  // Состояния для UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Состояния для фильтров
  const [sortConfig, setSortConfig] = useState({ key: 'annualized_return', direction: 'desc' });
  const [returnTypeFilter, setReturnTypeFilter] = useState('all'); // 'all', 'positive', 'negative', 'absolute'
  const [defaultComparisonExchange, setDefaultComparisonExchange] = useState('all');
  const [maxXpFilter, setMaxXpFilter] = useState('none'); // 'none', 'new', 'lowOi', 'lowVolume'
  const [searchQuery, setSearchQuery] = useState('');
  const [availableExchanges, setAvailableExchanges] = useState([]);

  // Загрузка настроек MAX XP фильтров
  useEffect(() => {
    const fetchMaxXpSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/config/max-xp-settings`);
        setMaxXpSettings(response.data);
      } catch (err) {
        console.error('Error fetching MAX XP settings:', err);
        // Используем дефолтные значения, если запрос не удался
      }
    };
    
    fetchMaxXpSettings();
  }, []);

  // Загрузка метрик для MAX XP фильтров
  useEffect(() => {
    const fetchAssetMetrics = async () => {
      try {
        const response = await axios.get(`${API_URL}/asset-metrics`);
        setAssetMetrics(response.data);
        console.log("Получены метрики активов:", Object.keys(response.data).length);
        
        // Проверяем наличие данных
        const nonZeroOi = Object.values(response.data)
          .filter(m => m.openInterest > 0).length;
        const nonZeroVolume = Object.values(response.data)
          .filter(m => m.volume > 0).length;
        console.log(`Активы с ненулевым OI: ${nonZeroOi}, с ненулевым объемом: ${nonZeroVolume}`);
      } catch (err) {
        console.error('Error fetching asset metrics:', err);
        setAssetMetrics({});
      }
    };
    
    fetchAssetMetrics();
    
    // Обновляем метрики каждые 5 минут
    const intervalId = setInterval(fetchAssetMetrics, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Загрузка сохраненных настроек пользователя
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

  // Сохранение настроек пользователя при их изменении
  useEffect(() => {
    localStorage.setItem('defaultComparisonExchange', defaultComparisonExchange);
    localStorage.setItem('returnTypeFilter', returnTypeFilter);
    localStorage.setItem('sortConfig', JSON.stringify(sortConfig));
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('maxXpFilter', maxXpFilter);
  }, [defaultComparisonExchange, returnTypeFilter, sortConfig, searchQuery, maxXpFilter]);

  // Сохранение позиции прокрутки при уходе со страницы
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
      // Получаем все уникальные биржи, которые имеют арбитражные возможности с Paradex
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

  // Загрузка арбитражных возможностей
  useEffect(() => {
    fetchData();
    
    // Автоматическое обновление каждые 5 минут
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Функция загрузки арбитражных возможностей
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/opportunities`);
      console.log("Получено с API:", response.data.length, "записей");
      
      // Фильтруем данные - только те, где участвует Paradex, и исключаем DYDX
      const paradexOpportunities = response.data.filter(opp => 
        (opp.exchange1 === 'Paradex' || opp.exchange2 === 'Paradex') &&
        opp.exchange1 !== 'DYDX' && opp.exchange2 !== 'DYDX'
      );
      console.log("Отфильтровано с Paradex (без DYDX):", paradexOpportunities.length);
      
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

  // Обработчик обновления данных
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

  // Функции форматирования
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

  // Определение класса стиля для значений
  const getValueClass = (value) => {
    return parseFloat(value) > 0 ? 'positive' : parseFloat(value) < 0 ? 'negative' : '';
  };

  // Обработчик изменения поисковой строки
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Фильтрация и сортировка возможностей
  const filteredOpportunities = React.useMemo(() => {
    let filtered = [...opportunities];
    
    // Проверим, есть ли данные вообще
    if (filtered.length === 0) {
      return [];
    }
    
    // Фильтр по бирже для сравнения с Paradex
    if (defaultComparisonExchange !== 'all') {
      filtered = filtered.filter(opp => 
        (opp.exchange1 === 'Paradex' && opp.exchange2 === defaultComparisonExchange) || 
        (opp.exchange1 === defaultComparisonExchange && opp.exchange2 === 'Paradex')
      );
    }
    
    // Фильтр по типу доходности
    if (returnTypeFilter === 'positive') {
      filtered = filtered.filter(opp => parseFloat(opp.annualized_return) > 0);
    } else if (returnTypeFilter === 'negative') {
      filtered = filtered.filter(opp => parseFloat(opp.annualized_return) < 0);
    }

    // Фильтр по поисковому запросу
    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(opp => 
        opp.symbol.toLowerCase().includes(query)
      );
    }
    
    // Фильтр MAX XP
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

  // Индикатор загрузки
  if (loading && opportunities.length === 0) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div>
      {/* Заголовок и кнопка обновления */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="dashboard-title">Funding Arbitrage Dashboard</h2>
        <div>
          {lastUpdated && (
            <span style={{ marginRight: '15px', color: '#aaa', fontSize: '14px' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={handleRefresh} className="btn" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      {/* Сообщение об ошибке */}
      {error && <div className="error">{error}</div>}
      
      {/* Блок фильтров */}
      <div className="card">
        <h3 className="card-title">Filter Options</h3>
        
        {/* Поиск по символу */}
        <div style={{marginBottom: '15px'}}>
          <span className="filter-label">Search by Symbol:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter symbol..."
            className="search-input"
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: '200px',
              marginLeft: '10px'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary"
              style={{marginLeft: '5px'}}
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Фильтр по бирже для сравнения */}
        <div style={{marginBottom: '15px'}}>
          <span className="filter-label">Compare Paradex with:</span>
          <div className="filter-group">
            <button
              onClick={() => setDefaultComparisonExchange('all')}
              className={`btn btn-secondary ${defaultComparisonExchange === 'all' ? 'active' : ''}`}
            >
              All Exchanges
            </button>
            {availableExchanges.map(exchange => (
              <button
                key={exchange}
                onClick={() => setDefaultComparisonExchange(exchange)}
                className={`btn btn-secondary ${defaultComparisonExchange === exchange ? 'active' : ''}`}
              >
                {exchange}
              </button>
            ))}
          </div>
        </div>
        
        {/* MAX XP фильтры */}
        <div style={{marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
          <span className="filter-label" style={{fontWeight: 'bold', color: '#4a90e2'}}>MAX XP Filters:</span>
          <div className="filter-group">
            <button
              onClick={() => setMaxXpFilter('none')}
              className={`btn btn-secondary ${maxXpFilter === 'none' ? 'active' : ''}`}
            >
              None
            </button>
            <button
              onClick={() => setMaxXpFilter('new')}
              className={`btn btn-secondary ${maxXpFilter === 'new' ? 'active' : ''}`}
            >
              New Coins
            </button>
            <button
              onClick={() => setMaxXpFilter('lowOi')}
              className={`btn btn-secondary ${maxXpFilter === 'lowOi' ? 'active' : ''}`}
            >
              Low OI (≤{formatDollars(maxXpSettings.lowOiThreshold)})
            </button>
            <button
              onClick={() => setMaxXpFilter('lowVolume')}
              className={`btn btn-secondary ${maxXpFilter === 'lowVolume' ? 'active' : ''}`}
            >
              Low Volume (≤{formatDollars(maxXpSettings.lowVolumeThreshold)})
            </button>
          </div>
        </div>
        
        {/* Фильтр по типу доходности */}
        <div style={{marginBottom: '15px'}}>
          <span className="filter-label">Return Type:</span>
          <div className="filter-group">
            <button
              onClick={() => setReturnTypeFilter('all')}
              className={`btn btn-secondary ${returnTypeFilter === 'all' ? 'active' : ''}`}
            >
              All Returns
            </button>
            <button
              onClick={() => setReturnTypeFilter('positive')}
              className={`btn btn-secondary ${returnTypeFilter === 'positive' ? 'active' : ''}`}
            >
              Positive Only
            </button>
            <button
              onClick={() => setReturnTypeFilter('negative')}
              className={`btn btn-secondary ${returnTypeFilter === 'negative' ? 'active' : ''}`}
            >
              Negative Only
            </button>
            <button
              onClick={() => setReturnTypeFilter('absolute')}
              className={`btn btn-secondary ${returnTypeFilter === 'absolute' ? 'active' : ''}`}
            >
              Absolute Value
            </button>
          </div>
        </div>
        
        {/* Опции сортировки */}
        <div>
          <span className="filter-label">Sort by:</span>
          <div className="filter-group">
            <button
              onClick={() => setSortConfig({ 
                key: 'annualized_return', 
                direction: sortConfig.key === 'annualized_return' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
              })}
              className={`btn btn-secondary ${sortConfig.key === 'annualized_return' ? 'active' : ''}`}
            >
              Annual Return {sortConfig.key === 'annualized_return' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => setSortConfig({ 
                key: 'rate_difference', 
                direction: sortConfig.key === 'rate_difference' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
              })}
              className={`btn btn-secondary ${sortConfig.key === 'rate_difference' ? 'active' : ''}`}
            >
              Rate Difference {sortConfig.key === 'rate_difference' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => setSortConfig({ 
                key: 'symbol', 
                direction: sortConfig.key === 'symbol' && sortConfig.direction === 'asc' ? 'desc' : 'asc' 
              })}
              className={`btn btn-secondary ${sortConfig.key === 'symbol' ? 'active' : ''}`}
            >
              Symbol {sortConfig.key === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Статистические карточки */}
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
      
      {/* Таблица арбитражных возможностей */}
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
              <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>
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
                    <Link to={`/asset/${opp.symbol}`} style={{fontWeight: 'bold'}}>
                      {opp.symbol}
                    </Link>
                    {maxXpIndicator && (
                      <span 
                        title={metricsTooltip}
                        style={{marginLeft: '5px', cursor: 'help'}}
                      >
                        {maxXpIndicator}
                      </span>
                    )}
                  </td>
                  <td className={getValueClass(paradexRate)}>{formatPercent(paradexRate)}</td>
                  <td>{otherExchange}</td>
                  <td className={getValueClass(otherRate)}>{formatPercent(otherRate)}</td>
                  <td className={getValueClass(opp.rate_difference)}>
                    <span style={{fontWeight: 'bold'}}>{formatPercent(opp.rate_difference)}</span>
                  </td>
                  <td className={getValueClass(opp.annualized_return)}>
                    <span style={{fontWeight: 'bold'}}>{formatAnnualReturn(opp.annualized_return)}</span>
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