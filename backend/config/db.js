// config/db.js
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

// Проверка подключения
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Ошибка подключения к БД:', err.stack);
  }
  console.log('Успешное подключение к PostgreSQL');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};