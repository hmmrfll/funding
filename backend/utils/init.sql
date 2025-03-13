-- Создание базы данных (выполнять отдельно)
-- CREATE DATABASE funding_arbitrage;

-- Таблица активов
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица ставок фандинга Paradex
CREATE TABLE IF NOT EXISTS paradex_funding_rates (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    market VARCHAR(20) NOT NULL,
    funding_rate DECIMAL(16, 14) NOT NULL,
    funding_premium DECIMAL(16, 14),
    funding_index DECIMAL(20, 14),
    created_at BIGINT,  -- время в миллисекундах
    timestamp TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id, market, created_at)
);

-- Индекс для ускорения поиска по asset_id и timestamp
CREATE INDEX IF NOT EXISTS idx_paradex_asset_time ON paradex_funding_rates(asset_id, created_at);

-- Таблица ставок фандинга HyperLiquid
CREATE TABLE IF NOT EXISTS hyperliquid_funding_rates (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    funding_rate DECIMAL(16, 14) NOT NULL,
    premium DECIMAL(16, 14),
    next_funding_time BIGINT,  -- время в миллисекундах
    created_at BIGINT,  -- время в миллисекундах
    timestamp TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id, created_at)
);

-- Индекс для ускорения поиска по asset_id и timestamp
CREATE INDEX IF NOT EXISTS idx_hyperliquid_asset_time ON hyperliquid_funding_rates(asset_id, created_at);

-- Таблица для сравнения ставок фандинга (арбитражные возможности)
CREATE TABLE IF NOT EXISTS funding_arbitrage_opportunities (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    exchange1 VARCHAR(20) NOT NULL DEFAULT 'Paradex',  -- Биржа 1
    rate1 DECIMAL(16, 14) NOT NULL,                    -- Ставка на бирже 1
    exchange2 VARCHAR(20) NOT NULL DEFAULT 'HyperLiquid',  -- Биржа 2
    rate2 DECIMAL(16, 14) NOT NULL,                     -- Ставка на бирже 2
    rate_difference DECIMAL(16, 14) NOT NULL,
    annualized_return DECIMAL(16, 14) NOT NULL,
    recommended_strategy TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для ускорения выборки последних возможностей
CREATE INDEX IF NOT EXISTS idx_arbitrage_time ON funding_arbitrage_opportunities(created_at);

-- Таблица для хранения метаданных активов HyperLiquid
CREATE TABLE IF NOT EXISTS hyperliquid_asset_metadata (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    sz_decimals INTEGER,
    max_leverage INTEGER,
    is_delisted BOOLEAN DEFAULT FALSE,
    only_isolated BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id)
);

-- Таблица для хранения метаданных активов Paradex
CREATE TABLE IF NOT EXISTS paradex_asset_metadata (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    market VARCHAR(20) NOT NULL,
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    settlement_currency VARCHAR(10) NOT NULL,
    funding_period_hours INTEGER,
    max_funding_rate DECIMAL(10, 8),
    interest_rate DECIMAL(10, 8),
    clamp_rate DECIMAL(10, 8),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id, market)
);

-- Таблица для хранения прогнозируемых ставок фандинга
CREATE TABLE IF NOT EXISTS predicted_funding_rates (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    exchange VARCHAR(20) NOT NULL,  -- 'Paradex', 'HyperLiquid', 'Binance', 'Bybit'
    funding_rate DECIMAL(16, 14) NOT NULL,
    next_funding_time BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id, exchange, created_at)
);

-- Таблица для хранения цен активов
CREATE TABLE IF NOT EXISTS asset_prices (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    paradex_price DECIMAL(20, 10),
    hyperliquid_price DECIMAL(20, 10),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Индекс для ускорения поиска по asset_id и timestamp
CREATE INDEX IF NOT EXISTS idx_prices_asset_time ON asset_prices(asset_id, timestamp);

-- Таблица для хранения статистики арбитража
CREATE TABLE IF NOT EXISTS arbitrage_statistics (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    total_opportunities INTEGER DEFAULT 0,
    avg_rate_difference DECIMAL(16, 14),
    max_rate_difference DECIMAL(16, 14),
    avg_annualized_return DECIMAL(16, 14),
    max_annualized_return DECIMAL(16, 14),
    date DATE DEFAULT CURRENT_DATE,
    UNIQUE (asset_id, date)
);

CREATE TABLE IF NOT EXISTS binance_funding_rates (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    symbol VARCHAR(20) NOT NULL,
    funding_rate DECIMAL(16, 14) NOT NULL,
    funding_time BIGINT,  
    mark_price DECIMAL(20, 10),
    created_at BIGINT,  
    timestamp TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id, symbol, funding_time)
);

CREATE TABLE IF NOT EXISTS binance_asset_metadata (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    symbol VARCHAR(20) NOT NULL,
    adjusted_funding_rate_cap DECIMAL(16, 14),
    adjusted_funding_rate_floor DECIMAL(16, 14),
    funding_interval_hours INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (asset_id, symbol)
);