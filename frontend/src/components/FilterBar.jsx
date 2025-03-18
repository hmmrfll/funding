// src/components/FilterBar.jsx
import React, { useState } from 'react';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  defaultComparisonExchange,
  setDefaultComparisonExchange,
  availableExchanges,
  maxXpFilter,
  setMaxXpFilter,
  returnTypeFilter,
  setReturnTypeFilter,
  sortConfig,
  setSortConfig,
  LOW_OI_THRESHOLD,
  LOW_VOLUME_THRESHOLD,
  formatDollars
}) => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  return (
    <div className="filter-bar-container">
      {/* Поисковая строка и кнопка фильтров */}
      <div className="search-filter-row">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by symbol..."
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>
        
        <button 
          onClick={toggleFilters} 
          className={`filter-toggle-btn ${filtersVisible ? 'active' : ''}`}
        >
          <FiFilter />
          <span>Filter</span>
        </button>
      </div>
      
      {/* Раскрывающийся блок с фильтрами */}
      {filtersVisible && (
        <div className="expanded-filters">
          {/* Биржи для сравнения */}
          <div className="filter-section">
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
          <div className="filter-section">
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
          
          {/* Сортировка */}
          <div className="filter-section">
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

          {/* MAX XP фильтры */}
          <div className="filter-section max-xp-section">
            <span className="filter-label">MAX XP Filters:</span>
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
                New Coins 🆕
              </button>
              <button
                onClick={() => setMaxXpFilter('lowOi')}
                className={`btn btn-secondary ${maxXpFilter === 'lowOi' ? 'active' : ''}`}
              >
                Low OI (≤{formatDollars(LOW_OI_THRESHOLD)}) 💰
              </button>
              <button
                onClick={() => setMaxXpFilter('lowVolume')}
                className={`btn btn-secondary ${maxXpFilter === 'lowVolume' ? 'active' : ''}`}
              >
                Low Volume (≤{formatDollars(LOW_VOLUME_THRESHOLD)}) 📊
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;