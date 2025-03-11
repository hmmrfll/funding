// middleware/errorHandler.js
const config = require('../config/config');

// Обработчик ошибок
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Подробное логирование ошибки в консоль
  console.error(`[${new Date().toISOString()}] Ошибка:`, err);
  
  // Формирование ответа клиенту
  const response = {
    status: 'error',
    message: err.message || 'Внутренняя ошибка сервера',
  };
  
  // В режиме разработки добавляем стек ошибки
  if (config.app.env === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

module.exports = errorHandler;