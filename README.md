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
```
```bash
Install dependencies:
bashCopynpm install
```
Set up environment variables:
```bash
bashCopycp .env.example .env
```

# Edit .env with your database and API credentials

Initialize the database:
```bash
bashCopypsql -U postgres -f src/db/init.sql
```

Start the development server:
```bash
bashCopynpm run dev
```

Visit http://localhost:5173 in your browser

Production Deployment
For production deployment, build the optimized assets:
```bash
bashCopynpm run build
npm start
```

# Architecture
## Frontend

React.js for UI components
React Router for page navigation
CSS variables for theming
Responsive design with CSS Grid and Flexbox

## Backend

Node.js & Express server
PostgreSQL database for data storage
RESTful API endpoints
Scheduled tasks for data updates

## Data Collection
The application collects funding rate data from various exchanges:

Paradex
HyperLiquid
Binance
Bybit
OKX

Data is updated every 5 minutes and processed to identify arbitrage opportunities.

## API Documentation
The backend provides several API endpoints:

GET /api/opportunities - Returns all current arbitrage opportunities
GET /api/asset-metrics - Returns metrics for all assets (OI, volume, etc.)
GET /api/all-rates/:symbol - Returns current funding rates for a specific asset
GET /api/metadata/:symbol - Returns metadata for a specific asset
POST /api/update - Triggers manual data update

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

# License
This project is licensed under the MIT License - see the LICENSE file for details.
Disclaimer
This software is for informational purposes only. It does not constitute financial advice, and users should conduct their own research before executing any trading strategies. Cryptocurrency trading involves significant risk.
Acknowledgements

Paradex
HyperLiquid
Binance
Bybit
OKX
React Icons
Chart.js

Contact
Project Link: https://github.com/yourusername/funding-arbitrage

Made with ❤️ for crypto traders by [Your Name]