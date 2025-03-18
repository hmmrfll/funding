import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Функция инициализации темы
function initTheme() {
  // Проверяем сохраненную тему в localStorage
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    // Если тема была сохранена, используем её
    document.documentElement.setAttribute('data-theme', savedTheme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        savedTheme === 'dark' ? '#0d1117' : '#ffffff'
      );
    }
  } else {
    // Иначе проверяем системные настройки
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        theme === 'dark' ? '#0d1117' : '#ffffff'
      );
    }
    localStorage.setItem('theme', theme);
  }
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', initTheme);

// Обработчик для изменения системной темы
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  // Проверяем, хотим ли мы следовать системной теме
  const hasUserThemePref = localStorage.getItem('theme');
  if (!hasUserThemePref) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        newTheme === 'dark' ? '#0d1117' : '#ffffff'
      );
    }
    localStorage.setItem('theme', newTheme);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);