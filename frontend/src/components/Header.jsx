// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  // Состояние для отслеживания текущей темы
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const botUsername = process.env.VITE_APP_BOT_USERNAME;
  const location = useLocation();

  // При монтировании компонента проверяем сохраненную тему или системные настройки
  useEffect(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Если тема была сохранена, используем её
      setIsDarkTheme(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Иначе проверяем системные настройки
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    
    // Проверяем сохраненные данные пользователя
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
      setIsLoggedIn(true);
    }
  }, []);
  
  // Проверяем параметры URL при монтировании или изменении URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userId = params.get('user_id');
    
    if (token && userId) {
      // Сохраняем данные пользователя
      const user = { token, userId };
      localStorage.setItem('userData', JSON.stringify(user));
      setUserData(user);
      setIsLoggedIn(true);
      
      // Очищаем URL от параметров (опционально)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleTelegramLogin = () => {
    // Создаем параметр авторизации с timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    const authParam = `auth_${timestamp}`;
    
    // Формируем URL для перехода в Telegram бот
    const telegramUrl = `https://t.me/${botUsername}?start=${authParam}`;
    
    // Перенаправляем пользователя
    window.location.href = telegramUrl;
  };
  
  const handleLogout = () => {
    // Удаляем данные пользователя
    localStorage.removeItem('userData');
    setUserData(null);
    setIsLoggedIn(false);
  };
  
  // Функция для переключения темы
  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Обновляем мета-тег theme-color для мобильных браузеров
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0d1117' : '#ffffff');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '800',
            background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            margin: 0
          }}>
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: '10px' }}
            >
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#grad1)" strokeWidth="2" />
              <path d="M16 12L10 16.5V7.5L16 12Z" fill="url(#grad1)" />
              <defs>
                <linearGradient id="grad1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--gradient-start)" />
                  <stop offset="1" stopColor="var(--gradient-end)" />
                </linearGradient>
              </defs>
            </svg>
            Funding Arbitrage
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '12px', 
              fontWeight: '600',
              padding: '4px 8px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15), rgba(156, 39, 176, 0.15))',
              color: 'var(--accent)',
              borderRadius: '12px',
              WebkitTextFillColor: 'var(--accent)',
              border: '1px solid rgba(88, 166, 255, 0.3)'
            }}>
              BETA
            </span>
          </h1>
        </Link>
        
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{ 
              color: 'var(--text-secondary)', 
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </Link>
          
          <a 
            href="https://github.com/hmmrfll/funding" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'var(--text-secondary)', 
              display: 'flex', 
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 19C4.7 20.4 4.7 16.5 3 16M15 21V17.5C15 16.5 15.1 16.1 14.5 15.5C17.3 15.2 20 14.1 20 9.49995C19.9988 8.30492 19.5325 7.15726 18.7 6.29995C19.0905 5.26192 19.0545 4.11158 18.6 3.09995C18.6 3.09995 17.5 2.79995 15.1 4.39995C13.0672 3.87054 10.9328 3.87054 8.9 4.39995C6.5 2.79995 5.4 3.09995 5.4 3.09995C4.94548 4.11158 4.90953 5.26192 5.3 6.29995C4.46745 7.15726 4.00122 8.30492 4 9.49995C4 14.1 6.7 15.2 9.5 15.5C8.9 16.1 8.9 16.7 9 17.5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            GitHub
          </a>
          
          {/* Переключатель темы */}
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-speed)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {/* Иконка солнца или луны в зависимости от текущей темы */}
            {isDarkTheme ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.93 4.93L6.34 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.66 17.66L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.34 17.66L4.93 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.07 4.93L17.66 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Светлая тема
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3C10.8065 4.19347 10.136 5.81217 10.136 7.5C10.136 9.18783 10.8065 10.8065 12 12C13.1935 13.1935 14.8122 13.864 16.5 13.864C18.1878 13.864 19.8065 13.1935 21 12C21 13.78 20.4722 15.5201 19.4832 17.0001C18.4943 18.4802 17.0887 19.6337 15.4442 20.3149C13.7996 20.9961 11.99 21.1743 10.2442 20.8271C8.49836 20.4798 6.89472 19.6226 5.63604 18.364C4.37737 17.1053 3.5202 15.5016 3.17294 13.7558C2.82567 12.01 3.0039 10.2004 3.68509 8.55585C4.36628 6.91131 5.51983 5.50571 6.99987 4.51677C8.47991 3.52784 10.22 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Темная тема
              </>
            )}
          </button>

          {/* Кнопка Telegram авторизации или выхода в зависимости от статуса входа */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '10px 15px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M16 17L21 12L16 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M21 12H9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
             Выйти
           </button>
         ) : (
           <button
             onClick={handleTelegramLogin}
             style={{
               backgroundColor: '#0088cc',
               color: 'white',
               border: 'none',
               borderRadius: '20px',
               padding: '10px 15px',
               fontSize: '14px',
               fontWeight: '500',
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               cursor: 'pointer',
               transition: 'background-color 0.3s ease'
             }}
             onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0077b5'}
             onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0088cc'}
           >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path
                 d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.89 8.17L15.94 17.11C15.84 17.61 15.55 17.73 15.13 17.5L12.03 15.25L10.53 16.69C10.42 16.8 10.33 16.89 10.13 16.89L10.27 13.73L15.61 8.9C15.78 8.75 15.58 8.67 15.36 8.82L8.81 12.93L5.76 11.97C5.27 11.82 5.26 11.49 5.86 11.24L17.07 7.08C17.49 6.93 17.86 7.17 17.89 7.63V8.17Z"
                 fill="white"
               />
             </svg>
             Войти через Telegram
           </button>
         )}
       </nav>
     </div>
   </header>
 );
};

export default Header;