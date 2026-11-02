import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { TRADES, getTradeByName } from '../data/trades';
import { useLanguage } from '../context/LanguageContext';
import SkillProofLevel from '../components/SkillProofLevel';

export default function FindWorkers() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTrade = searchParams.get('trade') || 'All';

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [selectedTrade, setSelectedTrade] = useState(initialTrade);
  const [areaQuery, setAreaQuery] = useState('');

  useEffect(() => {
    fetchPublishedCards();
  }, []);

  // Sync trade query param when changed
  const handleSelectTrade = (tradeName) => {
    setSelectedTrade(tradeName);
    if (tradeName === 'All') {
      searchParams.delete('trade');
    } else {
      searchParams.set('trade', tradeName);
    }
    setSearchParams(searchParams);
  };

  const fetchPublishedCards = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      // Query published cards along with work photos and vouches for proof score calculation
      const { data, error } = await supabase
        .from('skill_cards')
        .select('*, work_photos(id, caption), vouches(id, user_id)')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setErrorMessage('Could not load workers right now. Please check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered cards based on trade and area
  const filteredCards = cards.filter((c) => {
    const matchesTrade =
      selectedTrade === 'All' ||
      c.trade?.toLowerCase() === selectedTrade.toLowerCase();

    const matchesArea =
      !areaQuery.trim() ||
      c.area?.toLowerCase().includes(areaQuery.toLowerCase().trim()) ||
      c.card_name?.toLowerCase().includes(areaQuery.toLowerCase().trim()) ||
      (c.skills && c.skills.some(s => s.toLowerCase().includes(areaQuery.toLowerCase().trim())));

    return matchesTrade && matchesArea;
  });

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          {t('findWorkers', 'Find skilled workers')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }}>
          Browse verified skill cards, see real work proof, and contact trustworthy local hands.
        </p>
      </div>

      {/* Filter Bar Box */}
      <div className="card-box" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Area search input */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="area-search" className="form-label" style={{ fontSize: '0.9rem' }}>
            {t('customSkillPlaceholder', 'Search by town, area or skill')}
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.1rem',
                opacity: 0.6
              }}
            >
              📍
            </span>
            <input
              id="area-search"
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="e.g. Koramangala, Indiranagar, wiring, or AC..."
              value={areaQuery}
              onChange={(e) => setAreaQuery(e.target.value)}
            />
            {areaQuery && (
              <button
                type="button"
                onClick={() => setAreaQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Trade Filter Pills */}
        <div>
          <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
            Filter by trade
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleSelectTrade('All')}
              className={`btn btn-sm ${selectedTrade === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              ✨ All trades ({cards.length})
            </button>
            {TRADES.map((t) => {
              const isSelected = selectedTrade.toLowerCase() === t.name.toLowerCase();
              const count = cards.filter(c => c.trade?.toLowerCase() === t.name.toLowerCase()).length;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSelectTrade(t.name)}
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isSelected ? t.color : undefined,
                    color: isSelected ? '#2d2850' : undefined,
                    borderColor: isSelected ? t.borderColor : undefined
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="banner banner-error" role="alert">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>{errorMessage}</div>
        </div>
      )}

      {/* Cards List / States */}
      {loading ? (
        <div className="state-box">
          <div className="spinner" style={{ marginBottom: '1rem' }}></div>
          <p className="state-title">Looking for workers...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="state-box">
          <span className="state-icon">🔍</span>
          <h2 className="state-title">No workers found</h2>
          <p className="state-desc">
            {cards.length === 0
              ? 'No workers have published their card yet. Be the first to create one!'
              : 'Try clearing your area search or picking "All trades" to see more workers.'}
          </p>
          {cards.length === 0 ? (
            <Link to="/create" className="btn btn-primary">
              <span>Make the first card</span>
              <span>→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedTrade('All');
                setAreaQuery('');
              }}
              className="btn btn-secondary"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {filteredCards.map((c) => {
            const tObj = getTradeByName(c.trade);
            return (
              <Link
                key={c.id}
                to={`/card/${c.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${tObj.borderColor}`,
                  backgroundColor: 'var(--bg-card)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                className="worker-card-preview"
              >
                {/* Header banner with trade pastel */}
                <div
                  style={{
                    backgroundColor: tObj.color,
                    color: '#2d2850',
                    padding: '1rem 1.15rem',
                    borderBottom: `1px solid ${tObj.borderColor}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{tObj.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {c.trade}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ⏱️ {c.availability}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.25 }}>
                    {c.card_name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, marginTop: '0.2rem' }}>
                    📍 {c.area} • {c.years_experience} {c.years_experience === 1 ? 'yr' : 'yrs'} exp
                  </p>
                </div>

                {/* Card body */}
                <div style={{ padding: '1rem 1.15rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Skill Proof Level Mini Bar */}
                  <SkillProofLevel
                    card={c}
                    photos={c.work_photos || []}
                    vouches={c.vouches || []}
                    compact={true}
                  />

                  {c.story && (
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        marginBottom: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      &ldquo;{c.story}&rdquo;
                    </p>
                  )}

                  {/* Skills preview */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
                    {(c.skills || []).slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {(c.skills || []).length > 3 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        +{c.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      View card
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--btn-text)' }}>
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
