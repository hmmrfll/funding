// Обновленная версия Dashboard.jsx с фокусом на Paradex

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
  const [returnTypeFilter, setReturnTypeFilter] = useState('all'); // 'all', 'positive', 'negative', 'absolute'
  const [defaultComparisonExchange, setDefaultComparisonExchange] = useState('all');
  const [availableExchanges, setAvailableExchanges] = useState([]); // Будет заполнен динамически

  // Диагностический эффект для логирования состояния данных
  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      console.log("Total opportunities in DB:", opportunities.length);
      
      // Анализ наличия данных по биржам
      const paradexCount = opportunities.filter(opp => 
        opp.exchange1 === 'Paradex' || opp.exchange2 === 'Paradex'
      ).length;
      
      // Проверяем, какие биржи взаимодействуют с Paradex
      const hyperliquidCount = opportunities.filter(opp => 
        (opp.exchange1 === 'Paradex' && opp.exchange2 === 'HyperLiquid') || 
        (opp.exchange1 === 'HyperLiquid' && opp.exchange2 === 'Paradex')
      ).length;
      
      const bybitCount = opportunities.filter(opp => 
        (opp.exchange1 === 'Paradex' && opp.exchange2 === 'Bybit') || 
        (opp.exchange1 === 'Bybit' && opp.exchange2 === 'Paradex')
      ).length;
      
      const dydxCount = opportunities.filter(opp => 
        (opp.exchange1 === 'Paradex' && opp.exchange2 === 'DYDX') || 
        (opp.exchange1 === 'DYDX' && opp.exchange2 === 'Paradex')
      ).length;
      
      console.log("Paradex count:", paradexCount);
      console.log("Paradex + HyperLiquid count:", hyperliquidCount);
      console.log("Paradex + Bybit count:", bybitCount);
      console.log("Paradex + DYDX count:", dydxCount);
    }
    
    console.log("Selected comparison exchange:", defaultComparisonExchange);
  }, [opportunities, defaultComparisonExchange]);

  // Добавить в начале, после определения state
useEffect(() => {
  // Загрузка сохраненных настроек при инициализации
  const savedExchange = localStorage.getItem('defaultComparisonExchange');
  const savedReturnType = localStorage.getItem('returnTypeFilter');
  const savedSortConfig = JSON.parse(localStorage.getItem('sortConfig'));
  const savedScrollPosition = localStorage.getItem('scrollPosition');
  
  if (savedExchange) setDefaultComparisonExchange(savedExchange);
  if (savedReturnType) setReturnTypeFilter(savedReturnType);
  if (savedSortConfig) setSortConfig(savedSortConfig);
  
  // Восстановление позиции прокрутки
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
}, [defaultComparisonExchange, returnTypeFilter, sortConfig]);

// Сохранение позиции прокрутки при уходе со страницы
useEffect(() => {
  const handleBeforeUnload = () => {
    localStorage.setItem('scrollPosition', window.scrollY.toString());
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
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

  useEffect(() => {
    fetchData();
    
    // Автоматическое обновление каждые 5 минут
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Функция fetchData в Dashboard.jsx
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`${API_URL}/opportunities`);
    console.log("Получено с API:", response.data.length, "записей");
    console.log("Типы бирж:", [...new Set(response.data.map(o => o.exchange1)), ...new Set(response.data.map(o => o.exchange2))]);
    
    // Здесь можно увидеть, какие биржи представлены в данных
    const paradexHyper = response.data.filter(o => 
      (o.exchange1 === 'Paradex' && o.exchange2 === 'HyperLiquid') || 
      (o.exchange1 === 'HyperLiquid' && o.exchange2 === 'Paradex')
    ).length;
    
    const paradexBinance = response.data.filter(o => 
      (o.exchange1 === 'Paradex' && o.exchange2 === 'Binance') || 
      (o.exchange1 === 'Binance' && o.exchange2 === 'Paradex')
    ).length;
    
    const paradexBybit = response.data.filter(o => 
      (o.exchange1 === 'Paradex' && o.exchange2 === 'Bybit') || 
      (o.exchange1 === 'Bybit' && o.exchange2 === 'Paradex')
    ).length;
    
    const paradexDydx = response.data.filter(o => 
      (o.exchange1 === 'Paradex' && o.exchange2 === 'DYDX') || 
      (o.exchange1 === 'DYDX' && o.exchange2 === 'Paradex')
    ).length;
    
    console.log("Paradex-HyperLiquid:", paradexHyper);
    console.log("Paradex-Binance:", paradexBinance);
    console.log("Paradex-Bybit:", paradexBybit);
    console.log("Paradex-DYDX:", paradexDydx);
    
    // Фильтруем данные - только те, где участвует Paradex
    const paradexOpportunities = response.data.filter(opp => 
      opp.exchange1 === 'Paradex' || opp.exchange2 === 'Paradex'
    );
    console.log("Отфильтровано с Paradex:", paradexOpportunities.length);
    
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

  const getValueClass = (value) => {
    return parseFloat(value) > 0 ? 'positive' : parseFloat(value) < 0 ? 'negative' : '';
  };

  // Фильтрация и сортировка возможностей
  const filteredOpportunities = React.useMemo(() => {
    let filtered = [...opportunities];
    
    // Проверим, есть ли данные вообще
    if (filtered.length === 0) {
      return [];
    }
    
    // Если выбрана конкретная биржа для сравнения с Paradex (и не "all")
    if (defaultComparisonExchange !== 'all') {
      filtered = filtered.filter(opp => 
        (opp.exchange1 === 'Paradex' && opp.exchange2 === defaultComparisonExchange) || 
        (opp.exchange1 === defaultComparisonExchange && opp.exchange2 === 'Paradex')
      );
    }
    
    // Добавим фильтрацию по типу доходности
    if (returnTypeFilter === 'positive') {
      filtered = filtered.filter(opp => parseFloat(opp.annualized_return) > 0);
    } else if (returnTypeFilter === 'negative') {
      filtered = filtered.filter(opp => parseFloat(opp.annualized_return) < 0);
    }
    
    // Сортировка с учетом типа доходности
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
  }, [opportunities, defaultComparisonExchange, returnTypeFilter, sortConfig]);

  if (loading && opportunities.length === 0) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div>
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
      
      {error && <div className="error">{error}</div>}
      
      {/* Параметры и фильтры */}
      <div className="card">
        <h3 className="card-title">Filter Options</h3>
        
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
        
        {/* Фильтр для типа доходности */}
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
        
        return (
          <tr key={`${opp.symbol}-${index}`}>
            <td>
              <Link to={`/asset/${opp.symbol}`} style={{fontWeight: 'bold'}}>
                {opp.symbol}
              </Link>
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