# Funding Arbitrage Dashboard

A real-time monitoring tool designed for cryptocurrency traders to identify and capitalize on funding rate arbitrage opportunities across major crypto exchanges.



## 🚀 Overview

**Funding Arbitrage Dashboard** helps traders find profitable funding rate differentials between **Paradex** and other major cryptocurrency exchanges. The platform calculates potential annual returns and suggests trading strategies, allowing users to make informed decisions.

## 🔥 Key Features

### 📈 Core Functionality

- **Real-time Arbitrage Detection**: Continuously monitors funding rate differentials between Paradex and other exchanges (HyperLiquid, Bybit, Binance, OKX)
- **Strategy Recommendations**: Generates actionable trading strategies (e.g., "Long on HyperLiquid, Short on Paradex")
- **Multi-Exchange Support**: Compares funding rates across several major cryptocurrency exchanges

### 🛠️ Advanced Analysis & Filtering

- **Exchange Filters**: Filter opportunities by specific exchange pairs
- **Return Type Filtering**: Focus on positive-only, negative-only, or absolute value returns
- **MAX XP Filters**: Special filtering options to identify high-potential opportunities:
  - **🆕 New Coins**: Recently listed assets with potential volatility
  - **💰 Low Open Interest**: Assets with low market participation
  - **📊 Low Volume**: Assets with reduced trading activity
- **Advanced Sorting**: Sort by annual return, rate difference, or alphabetically
- **Quick Symbol Search**: Instantly find specific assets

### 🔍 Detailed Asset Information

- **📜 Asset Pages**: Dedicated pages for each cryptocurrency with detailed funding information
- **📊 Exchange Comparison**: Side-by-side funding rate comparison between exchanges
- **📈 Historical Data**: View funding rate trends and historical arbitrage opportunities
- **📉 Market Details**: Access comprehensive asset metadata from different exchanges

### 🎨 User Experience

- **🌙 Dark & ☀️ Light Themes**: Choose between dark and light UI modes
- **📱 Responsive Design**: Optimized for both desktop and mobile devices
- **🔄 Automatic Data Updates**: Fresh data every 5 minutes
- **💾 Session Persistence**: Remembers your filter settings between visits

### 🛠️ Technologies Used
### 👨‍💻 Programming Languages
<p>
    <a href="#"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?logo=javascript&logoColor=black"></a>
    <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC.svg?logo=typescript&logoColor=white"></a>
    <a href="#"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D.svg?logo=node.js&logoColor=white"></a>
    <a href="#"><img alt="SQL" src="https://custom-icon-badges.herokuapp.com/badge/SQL-025E8C.svg?logo=database&logoColor=white"></a>
    <a href="#"><img alt="CSS" src="https://img.shields.io/badge/CSS-1572B6.svg?logo=css3&logoColor=white"></a>
    <a href="#"><img alt="HTML" src="https://img.shields.io/badge/HTML-E34F26.svg?logo=html5&logoColor=white"></a>
</p>

### 🧰 Frameworks & Libraries

<p>
    <a href="#"><img alt="React" src="https://img.shields.io/badge/React-20232a.svg?logo=react&logoColor=%2361DAFB"></a>
    <a href="#"><img alt="Express.js" src="https://img.shields.io/badge/Express.js-404d59.svg?logo=express&logoColor=white"></a>
    <a href="#"><img alt="Chart.js" src="https://img.shields.io/badge/Chart.js-FF6384.svg?logo=chart.js&logoColor=white"></a>
</p>

### 🗄️ Databases & Hosting

<p>
    <a href="#"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-316192.svg?logo=postgresql&logoColor=white"></a>
    <a href="#"><img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-327FC7.svg?logo=github&logoColor=white"></a>
</p>

### 🔧 Installation

```bash
git clone https://github.com/yourusername/funding-arbitrage.git
cd funding-arbitrage
npm install
cp .env.example .env
```

Edit the `.env` file with your database and API credentials.

### 🛠️ Database Initialization

```bash
npm run init-db
```

### ▶ Starting Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 🚀 Production Deployment

```bash
npm run build
npm run init-db
npm start
```

## 🏗️ Architecture

### 🎨 Frontend

- React.js — for UI components
- React Router — for page navigation
- CSS variables — for theming
- Responsive design — CSS Grid and Flexbox

### 🖥️ Backend

- Node.js + Express — server-side
- PostgreSQL — database
- REST API — frontend communication
- Scheduled tasks — data updates every 5 minutes

### 📊 Data Collection

The application collects funding rate data from exchanges:

<p align="center">
  <img src="https://img.shields.io/badge/Paradex-000000.svg?style=for-the-badge&logo=data:image/png;base64,..." alt="Paradex">
  <img src="https://img.shields.io/badge/HyperLiquid-FF5733.svg?style=for-the-badge&logo=data:image/png;base64,..." alt="HyperLiquid">
  <img src="https://img.shields.io/badge/Binance-F0B90B.svg?style=for-the-badge&logo=binance&logoColor=white" alt="Binance">
  <img src="https://img.shields.io/badge/Bybit-FFAA33.svg?style=for-the-badge&logo=data:image/png;base64,..." alt="Bybit">
  <img src="https://img.shields.io/badge/OKX-000000.svg?style=for-the-badge&logo=okx&logoColor=white" alt="OKX">
</p>

## 📡 API

- `GET /api/opportunities` — all current arbitrage opportunities
- `GET /api/asset-metrics` — asset metrics (OI, volume, etc.)
- `GET /api/all-rates/:symbol` — current funding rates for a specific asset
- `GET /api/metadata/:symbol` — metadata for a specific asset
- `POST /api/update` — trigger manual data update

## 🤝 Contributing

Contributions are welcome!

```bash
git checkout -b feature/new-feature
git commit -m 'Add new feature'
git push origin feature/new-feature
```

## ⚠️ Disclaimer

This software is for informational purposes only. It does not constitute financial advice, and users should conduct their own research before executing any trading strategies.

## 💙 Acknowledgements

This project is inspired by and uses data from:

- Paradex
- HyperLiquid
- Binance
- Bybit
- OKX

## 📞 Contact

📌 [Telegram](https://t.me/+OBU4Qyuv8QBhMzQ6)