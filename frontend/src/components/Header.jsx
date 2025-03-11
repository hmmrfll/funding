// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          <h1>Funding Arbitrage Dashboard</h1>
        </Link>
        <nav>
          <Link to="/" style={{ color: 'white', marginRight: '15px' }}>Home</Link>
          <a href="https://github.com/yourusername/funding-arbitrage" 
             target="_blank" 
             rel="noopener noreferrer"
             style={{ color: 'white' }}>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;