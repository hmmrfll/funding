// initDb.js
const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function initializeDatabase() {
  try {
    // Чтение SQL-файла
    const sqlScript = fs.readFileSync(path.join(__dirname, './utils/init.sql'), 'utf8');
    
    console.log('Инициализация базы данных...');
    await pool.query(sqlScript);
    console.log('База данных успешно инициализирована');
    
    // Закрываем пул подключений после инициализации
    await pool.end();
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    process.exit(1);
  }
}

// Ожидание запуска базы данных перед инициализацией
const waitForDatabase = async () => {
  let retries = 10;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('Подключение к PostgreSQL установлено');
      return true;
    } catch (err) {
      console.log(`Ожидание запуска PostgreSQL... (осталось попыток: ${retries})`);
      retries -= 1;
      // Ждем 2 секунды перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error('Не удалось подключиться к PostgreSQL после нескольких попыток');
  return false;
};

// Запускаем процесс инициализации
waitForDatabase().then(success => {
  if (success) {
    initializeDatabase();
  } else {
    process.exit(1);
  }
});