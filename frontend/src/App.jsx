// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AssetPage from './pages/AssetPage';
import './App.css';

function App() {
  // Эта функция гарантирует сохранение темы при перезагрузке страницы
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/asset/:symbol" element={<AssetPage />} />
          </Routes>
        </main>
        <footer className="footer">
          &copy; {new Date().getFullYear()} Funding Arbitrage Dashboard | Data updates every 5 minutes
        </footer>
      </div>
    </Router>
  );
}

export default App;