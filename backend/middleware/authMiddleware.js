// middleware/authMiddleware.js
const { decryptData } = require('../utils/auth');
const db = require('../config/db');

/**
 * Middleware для проверки авторизации пользователя
 */
async function authMiddleware(req, res, next) {
  try {
    // Проверяем наличие заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    // Получаем токен
    const token = authHeader.replace('Bearer ', '');
    
    // Расшифровываем токен
    const { userId, timestamp } = decryptData(token);
    
    // Проверяем время действия токена (30 минут)
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - timestamp > 1800) {
      return res.status(401).json({ error: 'Срок действия токена истек' });
    }
    
    // Получаем пользователя из базы данных
    const query = `SELECT * FROM users WHERE telegram_id = $1 AND is_active = TRUE`;
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Добавляем пользователя в объект запроса
    req.user = result.rows[0];
    
    // Переходим к следующему обработчику
    next();
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    res.status(500).json({ error: 'Ошибка проверки авторизации' });
  }
}

/**
 * Middleware для проверки прав администратора
 */
async function adminMiddleware(req, res, next) {
  try {
    // Проверяем, что пользователь авторизован
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({ error: 'Недостаточно прав для доступа' });
    }
    
    // Если все проверки пройдены, продолжаем
    next();
  } catch (error) {
    console.error('Ошибка проверки прав доступа:', error);
    res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
}

module.exports = {
  authMiddleware,
  adminMiddleware
};