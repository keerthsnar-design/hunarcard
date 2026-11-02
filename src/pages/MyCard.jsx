import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, isConfigured } from '../lib/supabase';
import { getTradeByName } from '../data/trades';

export default function MyCard() {
  const navigate = useNavigate();
  const cardId = localStorage.getItem('hunar_my_card_id');

  const [card, setCard] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [vouches, setVouches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPublish, setUpdatingPublish] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!cardId) {
      setLoading(false);
      return;
    }
    loadCardData();
  }, [cardId]);

  const loadCardData = async () => {
    if (!cardId || !isConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      // Ensure session is restored from localStorage before querying
      await supabase.auth.getSession();

      // Fetch card
      const { data: cardData, error: cardError } = await supabase
        .from('skill_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError) {
        if (cardError.code === 'PGRST116') {
          // Card not found or not visible with current session
          setCard(null);
          setErrorMessage('Could not find your card with your current session. If it was unpublished, please check your connection and refresh.');
          return;
        }
        throw cardError;
      }

      setCard(cardData);

      // Fetch work photos
      const { data: photosData, error: photosError } = await supabase
        .from('work_photos')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: true });

      if (!photosError && photosData) {
        const mappedPhotos = photosData.map(p => {
          const { data: urlData } = supabase.storage
            .from('work-photos')
            .getPublicUrl(p.file_path);
          return { ...p, publicUrl: urlData?.publicUrl || '' };
        });
        setPhotos(mappedPhotos);
      }

      // Fetch vouches
      const { data: vouchesData, error: vouchesError } = await supabase
        .from('vouches')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (!vouchesError && vouchesData) {
        setVouches(vouchesData);
      }
    } catch (err) {
      console.error('Error loading my card:', err);
      setErrorMessage(err.message || 'Could not load your card details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!card || !isConfigured) return;
    const nextStatus = !card.is_published;

    try {
      setUpdatingPublish(true);
      setErrorMessage('');
      setSuccessMessage('');

      const { data, error } = await supabase
        .from('skill_cards')
        .update({ is_published: nextStatus })
        .eq('id', card.id)
        .select()
        .single();

      if (error) throw error;

      setCard(data);
      setSuccessMessage(
        nextStatus
          ? 'Your card is now live and published in Find Workers!'
          : 'Your card is now unpublished (private).'
      );
    } catch (err) {
      console.error('Error toggling publish state:', err);
      setErrorMessage(err.message || 'Could not change card publish status.');
    } finally {
      setUpdatingPublish(false);
    }
  };

  const handleCopyLink = () => {
    if (!card) return;
    const publicUrl = `${window.location.origin}/card/${card.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleDeleteCard = async () => {
    if (!card || !isConfigured) return;

    try {
      setDeleting(true);
      setErrorMessage('');

      // Delete the skill card row (cascades to work_photos and vouches in database)
      const { error } = await supabase
        .from('skill_cards')
        .delete()
        .eq('id', card.id);

      if (error) throw error;

      localStorage.removeItem('hunar_my_card_id');
      navigate('/create');
    } catch (err) {
      console.error('Error deleting card:', err);
      setErrorMessage(err.message || 'Could not delete your card. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-box" style={{ maxWidth: '640px', margin: '2rem auto' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}></div>
        <p className="state-title">Loading your Hunar Card...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="state-box" style={{ maxWidth: '580px', margin: '2rem auto' }}>
        <span className="state-icon">🪪</span>
        <h2 className="state-title">You don’t have a card yet</h2>
        <p className="state-desc">
          Make your free skill card in 2 minutes. No password, email, or Aadhaar required.
        </p>
        <Link to="/create" className="btn btn-primary" style={{ minHeight: '48px' }}>
          <span>Let’s make your card</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  const tradeObj = getTradeByName(card.trade);
  const publicShareUrl = `${window.location.origin}/card/${card.id}`;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            My Card
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Preview your card, manage privacy, and share your link.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/create?id=${card.id}`}
            className="btn btn-secondary btn-sm"
            title="Edit details"
          >
            <span>✏️</span>
            <span>Edit details</span>
          </Link>
          <Link
            to={`/work-proof/${card.id}`}
            className="btn btn-secondary btn-sm"
            title="Manage photos"
          >
            <span>📷</span>
            <span>Photos ({photos.length})</span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="banner banner-error" role="alert">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="banner banner-success" role="status">
          <span style={{ fontSize: '1.2rem' }}>✓</span>
          <div style={{ flex: 1 }}>{successMessage}</div>
        </div>
      )}

      {/* 1. Publish / Unpublish Switch Box */}
      <div className="card-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text-main)' }}>
            Card Visibility
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {card.is_published
              ? 'Published: Anyone with the link or browsing Find Workers can see your card.'
              : 'Unpublished: Your card is hidden from employers and search.'}
          </p>
        </div>

        <label className="switch-label" title={card.is_published ? 'Unpublish card' : 'Publish card'}>
          <input
            type="checkbox"
            className="switch-input"
            checked={Boolean(card.is_published)}
            disabled={updatingPublish}
            onChange={handleTogglePublish}
          />
          <span className="switch-track">
            <span className="switch-thumb"></span>
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '85px' }}>
            {card.is_published ? 'Published' : 'Hidden'}
          </span>
        </label>
      </div>

      {/* 2. Share Link & QR Code Box */}
      <div className="card-box">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
          Share your Hunar Card
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Share your link on WhatsApp, or show this QR code to customers so they can vouch for your work.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', smDirection: 'row', alignItems: 'center', gap: '1.25rem' }}>
          {/* QR Code Container */}
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'inline-flex',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <QRCodeSVG
              value={publicShareUrl}
              size={130}
              level="M"
              includeMargin={false}
            />
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                readOnly
                value={publicShareUrl}
                className="form-input"
                style={{ fontSize: '0.875rem', padding: '0.6rem 0.85rem', minHeight: '44px' }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-secondary"
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
              >
                <span>{copySuccess ? '✓ Copied' : '📋 Copy'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my Hunar Card: ${publicShareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: 'var(--pastel-mint)', color: '#163e2a' }}
              >
                <span>💬 Share on WhatsApp</span>
              </a>

              <Link
                to={`/card/${card.id}`}
                target="_blank"
                className="btn btn-secondary btn-sm"
              >
                <span>🔗 Open Public View</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Preview of the Card */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Card Preview (What employers see)
        </h3>

        <div
          className="showcase-card"
          style={{
            borderColor: tradeObj.borderColor
          }}
        >
          {/* Top trade colored header */}
          <div
            className="showcase-header"
            style={{
              backgroundColor: tradeObj.color,
              color: '#2d2850'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{tradeObj.icon}</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    opacity: 0.85
                  }}
                >
                  {card.trade}
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2 }}>
                {card.card_name}
              </h2>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.9, marginTop: '0.2rem' }}>
                📍 {card.area} • {card.years_experience} {card.years_experience === 1 ? 'year' : 'years'} experience
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span
                className="badge-tag"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.75)',
                  color: '#2d2850'
                }}
              >
                ⏱️ {card.availability}
              </span>
              {card.is_published ? (
                <span
                  className="badge-tag"
                  style={{ backgroundColor: 'var(--pastel-mint)', color: '#163e2a' }}
                >
                  ● Published
                </span>
              ) : (
                <span
                  className="badge-tag"
                  style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  ○ Unpublished
                </span>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: '1.5rem' }}>
            {/* Story */}
            {card.story && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  About me
                </h4>
                <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  &ldquo;{card.story}&rdquo;
                </p>
              </div>
            )}

            {/* Skills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Skills & Work
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {(card.skills || []).map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-subtle)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Work Photos Preview */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Work Photos ({photos.length}/3)
              </h4>
              {photos.length === 0 ? (
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    No work photos added yet.
                  </p>
                  <Link
                    to={`/work-proof/${card.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.5rem' }}
                  >
                    + Add photos now
                  </Link>
                </div>
              ) : (
                <div className="photo-slots-grid">
                  {photos.map((p, idx) => (
                    <div key={p.id || idx} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img
                        src={p.publicUrl}
                        alt={p.caption || 'Work sample'}
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      />
                      {p.caption && (
                        <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-main)', fontWeight: 600 }}>
                          {p.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Note if enabled */}
            {card.show_contact && card.contact && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--pastel-lilac)',
                  color: '#2d2850',
                  marginTop: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  <span>📞</span>
                  <span>Contact info</span>
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {card.contact}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Vouches summary */}
      <div className="card-box">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          What people say ({vouches.length})
        </h3>
        {vouches.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            No vouches yet. Share your card link or QR code with customers and colleagues to get your first vouch!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            {vouches.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span
                    className="badge-tag"
                    style={{
                      backgroundColor:
                        v.relation === 'Customer'
                          ? 'var(--pastel-mint)'
                          : v.relation === 'Colleague'
                          ? 'var(--pastel-sky)'
                          : 'var(--pastel-butter)',
                      color: '#2d2850'
                    }}
                  >
                    {v.relation}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  &ldquo;{v.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Delete Card Option */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="btn btn-danger-soft btn-sm"
        >
          <span>🗑️</span>
          <span>Delete my card</span>
        </button>
      </div>

      {/* Delete Confirmation Modal / Prompt */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100
          }}
        >
          <div
            className="card-box"
            style={{
              maxWidth: '460px',
              width: '100%',
              margin: 0,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Delete your Hunar Card?
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Are you sure? This will remove your card, work photos and vouches. You can also simply <strong>unpublish</strong> your card instead to hide it.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={deleting}
              >
                Keep my card
              </button>
              <button
                type="button"
                onClick={handleDeleteCard}
                className="btn btn-danger-soft"
                style={{ flex: 1 }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
