# Funding Arbitrage Dashboard

Мощный инструмент мониторинга в реальном времени, разработанный для криптотрейдеров, чтобы выявлять и использовать возможности арбитража ставок финансирования на крупнейших криптовалютных биржах.

![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/funding-arbitrage)
![GitHub stars](https://img.shields.io/github/stars/yourusername/funding-arbitrage?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/funding-arbitrage?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/funding-arbitrage)
![GitHub license](https://img.shields.io/github/license/yourusername/funding-arbitrage)

## 🚀 Обзор

**Funding Arbitrage Dashboard** помогает трейдерам находить прибыльные различия в ставках финансирования между **Paradex** и другими крупными криптовалютными биржами. Платформа рассчитывает потенциальную годовую доходность и предлагает стратегии торговли, позволяя пользователям принимать обоснованные решения.

## 🔥 Основные возможности

### 📈 Основной функционал

- **📡 Обнаружение арбитража в реальном времени**: мониторинг ставок финансирования между Paradex и другими биржами (HyperLiquid, Bybit, Binance, OKX)
- **🧠 Рекомендации по стратегии**: генерация торговых стратегий (например, "Лонг на HyperLiquid, Шорт на Paradex")
- **🌎 Поддержка нескольких бирж**: сравнение ставок финансирования на различных криптовалютных платформах

### 🛠️ Расширенный анализ и фильтрация

- **🔍 Фильтры бирж**: поиск возможностей по конкретным биржам
- **📊 Фильтрация доходности**: выбор положительной, отрицательной или абсолютной доходности
- **📈 Фильтры MAX XP**: специальные настройки для выявления потенциальных возможностей:
  - **🆕 Новые монеты**: недавно добавленные активы с высокой волатильностью
  - **💰 Низкий открытый интерес**: активы с небольшим числом открытых позиций
  - **📉 Низкий объем**: активы с малой торговой активностью
- **⚡ Расширенная сортировка**: по годовому доходу, разнице ставок или в алфавитном порядке
- **🔎 Быстрый поиск**: мгновенный поиск конкретных активов

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

## 🛠️ Технологии

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D.svg?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791.svg?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A.svg?logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2496ED.svg?logo=docker&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000.svg?logo=express&logoColor=white)

## 🚀 Начало работы

### 📌 Требования

- Node.js v14 или выше
- PostgreSQL 12 или выше
- Доступ к API поддерживаемых бирж (опционально для полной функциональности)

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

- Paradex
- HyperLiquid
- Binance
- Bybit
- OKX

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
