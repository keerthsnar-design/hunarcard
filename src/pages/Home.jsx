import React from 'react';
import { Link } from 'react-router-dom';
import { TRADES } from '../data/trades';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const existingCardId = localStorage.getItem('hunar_my_card_id');

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Hero Welcome */}
      <div style={{ textAlign: 'center', padding: '1.5rem 0 2rem 0' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--pastel-lilac)',
            color: 'var(--text-main)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}
        >
          <span>✨</span>
          <span>Simple skills, real work proof</span>
        </div>
        <h1
          style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: '0.75rem',
            color: 'var(--text-main)'
          }}
        >
          {t('heroTitle', 'Your work speaks. Let’s make your card.')}
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            maxWidth: '480px',
            margin: '0 auto'
          }}
        >
          {t('heroSubtitle', 'For electricians, plumbers, drivers, technicians and operators. No password, no resume, no hassle.')}
        </p>
      </div>

      {/* Two Large Icon Action Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}
      >
        <Link
          to={existingCardId ? '/my-card' : '/create'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1.5rem 1.25rem',
            backgroundColor: 'var(--btn-bg)',
            color: 'var(--btn-text)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-md)',
            border: '2px solid transparent',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          className="home-big-btn"
        >
          <span
            style={{
              fontSize: '3rem',
              lineHeight: 1,
              flexShrink: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              width: '68px',
              height: '68px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🪪
          </span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {t('workerBtn', 'I am a worker')}
            </h2>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.35 }}>
              {existingCardId
                ? 'View, edit or share your Hunar Card'
                : t('workerSubtext', 'Make your free skill card in 2 minutes. No password needed.')}
            </p>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>→</span>
        </Link>

        <Link
          to="/find"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1.5rem 1.25rem',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-md)',
            border: '2px solid var(--border-color)',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
          className="home-big-btn"
        >
          <span
            style={{
              fontSize: '3rem',
              lineHeight: 1,
              flexShrink: 0,
              backgroundColor: 'var(--pastel-sky)',
              width: '68px',
              height: '68px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🔍
          </span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {t('hiringBtn', 'I am hiring')}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              {t('hiringSubtext', 'Find skilled workers nearby with real photos and honest customer vouches.')}
            </p>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>→</span>
        </Link>
      </div>

      {/* Trades Carousel/List */}
      <div className="card-box" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
          Trades on Hunar Card
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {TRADES.map(trade => (
            <Link
              key={trade.id}
              to={`/find?trade=${encodeURIComponent(trade.name)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: '1px solid var(--border-color)'
              }}
            >
              <span>{trade.icon}</span>
              <span>{trade.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3 Simple Steps */}
      <div style={{ marginTop: '2rem' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            marginBottom: '1rem',
            textAlign: 'center',
            color: 'var(--text-main)'
          }}
        >
          How Hunar Card works
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}
        >
          <div className="card-box" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1️⃣</div>
            <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>Choose skills</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Pick your trade, experience, and the jobs you do best.
            </p>
          </div>

          <div className="card-box" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2️⃣</div>
            <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>Add work photos</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Add up to 3 photos of your real work so people can see your craft.
            </p>
          </div>

          <div className="card-box" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3️⃣</div>
            <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>Share & get vouched</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Share your QR code on WhatsApp. Customers can leave a 140-char vouch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
