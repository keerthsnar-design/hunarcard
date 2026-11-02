import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  const myCardId = localStorage.getItem('hunar_my_card_id');

  return (
    <header className="header-bar">
      <div className="header-inner">
        <Link to="/" className="brand-link" aria-label="Hunar Card Home">
          <span style={{ fontSize: '1.4rem' }}>🪪</span>
          <span>{t('appName', 'Hunar Card')}</span>
        </Link>

        <div className="header-actions">
          {/* Language Switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Select language"
              style={{
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <Link
            to="/find"
            className={`btn btn-sm ${location.pathname === '/find' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700 }}
          >
            <span>🔍</span>
            <span>{t('findWorkers', 'Find Workers')}</span>
          </Link>

          <Link
            to={myCardId ? `/my-card` : `/create`}
            className={`btn btn-sm ${location.pathname.startsWith('/my-card') || location.pathname.startsWith('/create') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700 }}
          >
            <span>👤</span>
            <span>{myCardId ? t('myCard', 'My Card') : t('makeCard', 'Make Card')}</span>
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
