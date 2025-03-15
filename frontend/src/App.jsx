// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AssetPage from './pages/AssetPage';
import './App.css';

function App() {
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