// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #2196f3, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center'
          }}>
            Funding Arbitrage
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              fontWeight: 'normal',
              padding: '2px 6px',
              background: 'rgba(33, 150, 243, 0.2)',
              color: '#2196f3',
              borderRadius: '4px',
              WebkitTextFillColor: '#2196f3'
            }}>
              Beta
            </span>
          </h1>
        </Link>
        
        <nav>
          <Link to="/" style={{ color: '#aaa', marginRight: '15px' }}>Dashboard</Link>
          <a 
            href="https://github.com/yourusername/funding-arbitrage" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#aaa', display: 'inline-flex', alignItems: 'center' }}
          >
            <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', marginRight: '5px' }}>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;