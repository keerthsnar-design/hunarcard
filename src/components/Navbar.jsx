import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const myCardId = localStorage.getItem('hunar_my_card_id');

  return (
    <header className="header-bar">
      <div className="header-inner">
        <Link to="/" className="brand-link" aria-label="Hunar Card Home">
          <span style={{ fontSize: '1.4rem' }}>🪪</span>
          <span>Hunar Card</span>
        </Link>

        <div className="header-actions">
          <Link
            to="/find"
            className={`btn btn-sm ${location.pathname === '/find' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700 }}
          >
            <span>🔍</span>
            <span>Find Workers</span>
          </Link>

          <Link
            to={myCardId ? `/my-card` : `/create`}
            className={`btn btn-sm ${location.pathname.startsWith('/my-card') || location.pathname.startsWith('/create') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700 }}
          >
            <span>👤</span>
            <span>{myCardId ? 'My Card' : 'Make Card'}</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
