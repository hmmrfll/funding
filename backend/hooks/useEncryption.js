// hooks/useEncryption.js
const crypto = require('crypto');

/**
 * Хук для работы с шифрованием данных
 */
const useEncryption = {
  /**
   * Шифрует данные пользователя и времени
   * @param {number|string} userId - ID пользователя
   * @param {number} timestamp - Временная метка
   * @returns {string} - Зашифрованный токен
   */
  encryptData: (userId, timestamp) => {
    const secretKey = process.env.TOKEN_SECRET || 'your-default-secret-key';
    
    // Создаем строку для шифрования
    const dataString = `${userId}:${timestamp}`;
    
    // Создаем шифр
    const cipher = crypto.createCipheriv('aes-256-cbc', 
      crypto.createHash('sha256').update(secretKey).digest().slice(0, 32), 
      Buffer.from('0000000000000000')); // IV - вектор инициализации
    
    // Шифруем данные
    let encrypted = cipher.update(dataString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encodeURIComponent(encrypted);
  },
  
  /**
   * Расшифровывает токен
   * @param {string} encryptedData - Зашифрованный токен
   * @returns {Object} - Объект с userId и timestamp
   */
  decryptData: (encryptedData) => {
    const secretKey = process.env.TOKEN_SECRET || 'your-default-secret-key';
    
    try {
      // Декодируем URL-кодированную строку
      const encodedData = decodeURIComponent(encryptedData);
      
      // Создаем дешифратор
      const decipher = crypto.createDecipheriv('aes-256-cbc', 
        crypto.createHash('sha256').update(secretKey).digest().slice(0, 32), 
        Buffer.from('0000000000000000')); // IV - вектор инициализации
      
      // Дешифруем данные
      let decrypted = decipher.update(encodedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Разбираем строку на userId и timestamp
      const [userId, timestamp] = decrypted.split(':');
      
      return {
        userId: parseInt(userId),
        timestamp: parseInt(timestamp)
      };
    } catch (error) {
      throw new Error(`Ошибка дешифрования данных: ${error.message}`);
    }
  },
  
  /**
   * Проверяет валидность токена
   * @param {string} token - Токен для проверки
   * @param {string|number} userId - ID пользователя для сравнения
   * @param {number} maxAge - Максимальное время жизни токена в секундах (по умолчанию 1 час)
   * @returns {boolean} - Результат проверки
   */
  verifyToken: (token, userId, maxAge = 3600) => {
    try {
      const decoded = useEncryption.decryptData(token);
      
      // Проверяем совпадение userId
      if (decoded.userId.toString() !== userId.toString()) {
        return false;
      }
      
      // Проверяем время жизни токена
      const currentTime = Math.floor(Date.now() / 1000);
      return (currentTime - decoded.timestamp) <= maxAge;
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return false;
    }
  }
};

module.exports = useEncryption;