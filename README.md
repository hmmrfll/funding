# Funding Arbitrage Dashboard

Мощный инструмент мониторинга в реальном времени, разработанный для криптотрейдеров, чтобы выявлять и использовать возможности арбитража ставок финансирования на крупнейших криптовалютных биржах.



## 🚀 Обзор

**Funding Arbitrage Dashboard** помогает трейдерам находить прибыльные различия в ставках финансирования между **Paradex** и другими крупными криптовалютными биржами. Платформа рассчитывает потенциальную годовую доходность и предлагает стратегии торговли, позволяя пользователям принимать обоснованные решения.

## 🔥 Основные возможности

### 📈 Основной функционал

- **Обнаружение арбитража в реальном времени**: мониторинг ставок финансирования между Paradex и другими биржами (HyperLiquid, Bybit, Binance, OKX)
- **Рекомендации по стратегии**: генерация торговых стратегий (например, "Лонг на HyperLiquid, Шорт на Paradex")
- **Поддержка нескольких бирж**: сравнение ставок финансирования на различных криптовалютных платформах

### 🛠️ Расширенный анализ и фильтрация

- **Фильтры бирж**: поиск возможностей по конкретным биржам
- **Фильтрация доходности**: выбор положительной, отрицательной или абсолютной доходности
- **Фильтры MAX XP**: специальные настройки для выявления потенциальных возможностей:
  - **🆕 Новые монеты**: недавно добавленные активы с высокой волатильностью
  - **💰 Низкий открытый интерес**: активы с небольшим числом открытых позиций
  - **📊 Низкий объем**: активы с малой торговой активностью
- **Расширенная сортировка**: по годовому доходу, разнице ставок или в алфавитном порядке
- **Быстрый поиск**: мгновенный поиск конкретных активов

### 🔍 Детальная информация по активам

- **📜 Страницы активов**: детальная информация по каждому активу
- **📊 Сравнение бирж**: ставки финансирования на различных биржах
- **📈 Исторические данные**: анализ трендов ставок финансирования
- **📉 Рыночные данные**: подробные метаданные активов с разных бирж

### 🎨 Пользовательский опыт

- **🌙 Тёмная и ☀️ светлая темы**: выбор цветовой схемы
- **📱 Адаптивный дизайн**: оптимизация для ПК и мобильных устройств
- **🔄 Автоматическое обновление данных**: новые данные каждые 5 минут
- **💾 Сохранение настроек**: фильтры и параметры сохраняются между сессиями

### 🛠️ Используемые технологии
### 👨‍💻 Языки программирования
<p>
    <a href="#"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?logo=javascript&logoColor=black"></a>
    <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC.svg?logo=typescript&logoColor=white"></a>
    <a href="#"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D.svg?logo=node.js&logoColor=white"></a>
    <a href="#"><img alt="SQL" src="https://custom-icon-badges.herokuapp.com/badge/SQL-025E8C.svg?logo=database&logoColor=white"></a>
    <a href="#"><img alt="CSS" src="https://img.shields.io/badge/CSS-1572B6.svg?logo=css3&logoColor=white"></a>
    <a href="#"><img alt="HTML" src="https://img.shields.io/badge/HTML-E34F26.svg?logo=html5&logoColor=white"></a>
</p>

### 🧰 Фреймворки и библиотеки

<p>
    <a href="#"><img alt="React" src="https://img.shields.io/badge/React-20232a.svg?logo=react&logoColor=%2361DAFB"></a>
    <a href="#"><img alt="Express.js" src="https://img.shields.io/badge/Express.js-404d59.svg?logo=express&logoColor=white"></a>
    <a href="#"><img alt="Chart.js" src="https://img.shields.io/badge/Chart.js-FF6384.svg?logo=chart.js&logoColor=white"></a>
</p>

### 🗄️ Базы данных и хостинг

<p>
    <a href="#"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-316192.svg?logo=postgresql&logoColor=white"></a>
    <a href="#"><img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-327FC7.svg?logo=github&logoColor=white"></a>
</p>

### 🔧 Установка

```bash
git clone https://github.com/yourusername/funding-arbitrage.git
cd funding-arbitrage
npm install
cp .env.example .env
```

Отредактируйте `.env`, добавив данные для подключения к базе и API.

### 🛠️ Инициализация базы данных

```bash
npm run init-db
```

### ▶ Запуск сервера разработки

```bash
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173) в браузере.

### 🚀 Развёртывание в продакшен

```bash
npm run build
npm run init-db
npm start
```

## 🏗️ Архитектура

### 🎨 Фронтенд

- React.js — для компонентов UI
- React Router — для маршрутизации
- CSS-переменные — для стилизации
- Адаптивный дизайн — CSS Grid и Flexbox

### 🖥️ Бэкенд

- Node.js + Express — серверная часть
- PostgreSQL — база данных
- REST API — взаимодействие с фронтендом
- Запланированные задачи — обновление данных каждые 5 минут

### 📊 Сбор данных

Приложение собирает ставки финансирования с бирж:

- ![Paradex](https://img.shields.io/badge/Paradex-000000.svg?logo=data:image/png;base64,...) Paradex
- ![HyperLiquid](https://img.shields.io/badge/HyperLiquid-FF5733.svg?logo=data:image/png;base64,...) HyperLiquid
- ![Binance](https://img.shields.io/badge/Binance-F0B90B.svg?logo=binance&logoColor=white) Binance
- ![Bybit](https://img.shields.io/badge/Bybit-FFAA33.svg?logo=data:image/png;base64,...) Bybit
- ![OKX](https://img.shields.io/badge/OKX-000000.svg?logo=okx&logoColor=white) OKX


## 📡 API

- `GET /api/opportunities` — все текущие арбитражные возможности
- `GET /api/asset-metrics` — метрики активов (открытый интерес, объём и т. д.)
- `GET /api/all-rates/:symbol` — текущие ставки финансирования для указанного актива
- `GET /api/metadata/:symbol` — метаданные актива
- `POST /api/update` — ручное обновление данных

## 🤝 Как внести вклад

Приветствуем вклад в проект!

```bash
git checkout -b feature/new-feature
git commit -m 'Добавлен новый функционал'
git push origin feature/new-feature
```

## ⚠️ Отказ от ответственности

Данное ПО предназначено исключительно для информационных целей. Оно не является финансовым советом, и пользователи должны самостоятельно анализировать рынок перед совершением сделок.

## 💙 Благодарности

Проект вдохновлён и использует данные от:

- Paradex
- HyperLiquid
- Binance
- Bybit
- OKX

## 📞 Контакты

📌 [Telegram](https://t.me/+OBU4Qyuv8QBhMzQ6)

