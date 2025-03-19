# Funding Arbitrage Dashboard

A powerful, real-time monitoring tool designed for cryptocurrency traders to identify and capitalize on funding rate arbitrage opportunities across major crypto exchanges.

![Dashboard Preview](https://example.com/dashboard-preview.png)

## Overview

Funding Arbitrage Dashboard helps traders identify profitable funding rate differentials between Paradex and other major cryptocurrency exchanges. The platform calculates potential annual returns and suggests specific trading strategies, allowing users to make informed decisions for funding arbitrage opportunities.

## Features

### Core Functionality

- **Real-time Arbitrage Detection**: Continuously monitors funding rate differentials between Paradex and other exchanges (HyperLiquid, Bybit, Binance, OKX)
- **Annualized Return Calculation**: Automatically calculates potential annual returns based on current funding rates
- **Strategy Recommendations**: Generates actionable trading strategies (e.g., "Long on HyperLiquid, Short on Paradex")
- **Multi-Exchange Support**: Compares funding rates across several major cryptocurrency exchanges

### Advanced Filtering & Analysis

- **Comprehensive Exchange Filters**: Filter opportunities by specific exchange pairs
- **Return Type Filtering**: Focus on positive-only, negative-only, or absolute value returns
- **MAX XP Filters**: Special filtering options to identify high-potential opportunities:
 - **New Coins** 🆕: Recently listed assets with potential volatility
 - **Low Open Interest** 💰: Assets with low market participation
 - **Low Volume** 📊: Assets with reduced trading activity
- **Advanced Sorting**: Sort by annual return, rate difference, or alphabetically
- **Quick Symbol Search**: Instantly find specific assets

### Detailed Asset Information

- **Asset Pages**: Dedicated pages for each cryptocurrency with detailed funding information
- **Exchange Comparison**: Side-by-side funding rate comparison between exchanges
- **Historical Data**: View funding rate trends and historical arbitrage opportunities
- **Market Details**: Access comprehensive asset metadata from different exchanges

### User Experience

- **Dark & Light Themes**: Choose between dark and light UI modes
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Automatic Data Updates**: Fresh data every 5 minutes
- **Session Persistence**: Remembers your filter settings between visits

## Getting Started

### Prerequisites

- Node.js v14 or higher
- PostgreSQL 12 or higher
- API access to supported exchanges (optional for full functionality)

### Installation

1. Clone the repository:
  ```bash
  git clone https://github.com/yourusername/funding-arbitrage.git
  cd funding-arbitrage