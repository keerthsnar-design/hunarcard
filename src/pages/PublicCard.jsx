import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { getTradeByName } from '../data/trades';
import { useLanguage } from '../context/LanguageContext';
import SkillProofLevel from '../components/SkillProofLevel';

export default function PublicCard() {
  const { t } = useLanguage();
  const { id } = useParams();

  const [card, setCard] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [vouches, setVouches] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userVouch, setUserVouch] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submittingVouch, setSubmittingVouch] = useState(false);
  const [deletingVouch, setDeletingVouch] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Vouch form state
  const [relation, setRelation] = useState('Customer');
  const [comment, setComment] = useState('');

  // Lightbox for photos
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    loadCardAndVouches();
  }, [id]);

  const loadCardAndVouches = async () => {
    if (!id || !isConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      // Check current user session if any
      const { data: sessionData } = await supabase.auth.getSession();
      let uid = sessionData?.session?.user?.id || null;
      if (!uid) {
        const { data: authData } = await supabase.auth.getUser();
        uid = authData?.user?.id || null;
      }
      setCurrentUserId(uid);

      // Fetch card
      const { data: cardData, error: cardError } = await supabase
        .from('skill_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (cardError) {
        setCard(null);
        return;
      }

      setCard(cardData);

      // Fetch work photos
      const { data: photoData, error: photoError } = await supabase
        .from('work_photos')
        .select('*')
        .eq('card_id', id)
        .order('created_at', { ascending: true });

      if (!photoError && photoData) {
        const mapped = photoData.map(p => {
          const { data: urlData } = supabase.storage
            .from('work-photos')
            .getPublicUrl(p.file_path);
          return { ...p, publicUrl: urlData?.publicUrl || '' };
        });
        setPhotos(mapped);
      }

      // Fetch vouches
      const { data: vouchData, error: vouchError } = await supabase
        .from('vouches')
        .select('*')
        .eq('card_id', id)
        .order('created_at', { ascending: false });

      if (!vouchError && vouchData) {
        setVouches(vouchData);
        if (uid) {
          const mine = vouchData.find(v => v.user_id === uid);
          setUserVouch(mine || null);
        }
      }
    } catch (err) {
      console.error('Error loading public card:', err);
      setErrorMessage('Could not load card. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVouchSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!comment.trim()) {
      setErrorMessage('Please write a short note about working with this person.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Add your keys to .env.local to vouch.');
      return;
    }

    try {
      setSubmittingVouch(true);

      // 1. Ensure user is signed in anonymously if not already
      let uid = currentUserId;
      if (!uid) {
        const { data: sessionData } = await supabase.auth.getSession();
        uid = sessionData?.session?.user?.id || null;
      }
      if (!uid) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          throw new Error(`Could not sign in: ${anonError.message}`);
        }
        uid = anonData?.user?.id;
        setCurrentUserId(uid);
      }

      if (!uid) {
        throw new Error('Could not identify user. Please try again.');
      }

      if (uid === card.user_id) {
        throw new Error('You cannot vouch for your own card.');
      }

      // 2. Insert vouch
      const { data, error } = await supabase
        .from('vouches')
        .insert({
          card_id: card.id,
          user_id: uid,
          comment: comment.trim().slice(0, 140),
          relation: relation
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already vouched for this card.');
        }
        throw error;
      }

      setSuccessMessage(`Thank you! Your vouch for ${card.card_name} has been added.`);
      setComment('');
      setUserVouch(data);
      setVouches([data, ...vouches]);
    } catch (err) {
      console.error('Error submitting vouch:', err);
      setErrorMessage(err.message || 'Could not save your vouch. Please try again.');
    } finally {
      setSubmittingVouch(false);
    }
  };

  const handleDeleteMyVouch = async () => {
    if (!userVouch) return;
    if (!window.confirm('Do you want to remove your vouch?')) return;

    try {
      setDeletingVouch(true);
      setErrorMessage('');
      setSuccessMessage('');

      const { error } = await supabase
        .from('vouches')
        .delete()
        .eq('id', userVouch.id);

      if (error) throw error;

      setVouches(vouches.filter(v => v.id !== userVouch.id));
      setUserVouch(null);
      setSuccessMessage('Your vouch has been removed.');
    } catch (err) {
      console.error('Error removing vouch:', err);
      setErrorMessage(err.message || 'Could not remove vouch. Please try again.');
    } finally {
      setDeletingVouch(false);
    }
  };

  if (loading) {
    return (
      <div className="state-box" style={{ maxWidth: '640px', margin: '3rem auto' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}></div>
        <p className="state-title">Loading skill card...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="state-box" style={{ maxWidth: '580px', margin: '3rem auto' }}>
        <span className="state-icon">🔍</span>
        <h2 className="state-title">Card not found</h2>
        <p className="state-desc">
          This Hunar Card may have been hidden, unpublished or removed by the worker.
        </p>
        <Link to="/find" className="btn btn-primary">
          <span>Find other skilled workers</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  const tradeObj = getTradeByName(card.trade);
  const isOwner = currentUserId && currentUserId === card.user_id;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Top back navigation */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/find" className="btn btn-secondary btn-sm">
          <span>← Back to all workers</span>
        </Link>

        {isOwner && (
          <Link to="/my-card" className="btn btn-secondary btn-sm">
            <span>⚙️ Manage my card</span>
          </Link>
        )}
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

      {/* Main Showcase Skill Card */}
      <div
        className="showcase-card"
        style={{
          borderColor: tradeObj.borderColor
        }}
      >
        {/* Trade header */}
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>
              {card.card_name}
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.9, marginTop: '0.2rem' }}>
              📍 {card.area} • {card.years_experience} {card.years_experience === 1 ? 'year' : 'years'} experience
            </p>
          </div>

          <div>
            <span
              className="badge-tag"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#2d2850'
              }}
            >
              ⏱️ {card.availability}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Story */}
          {card.story && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                About me
              </h3>
              <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text-main)', lineHeight: 1.45 }}>
                &ldquo;{card.story}&rdquo;
              </p>
            </div>
          )}

          {/* Skills tags */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
              Skills & Services
            </h3>
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

          {/* Work Proof Photos */}
          {photos.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Real Work Proof ({photos.length})
              </h3>
              <div className="photo-slots-grid">
                {photos.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-subtle)'
                    }}
                    onClick={() => setActivePhoto(p)}
                  >
                    <img
                      src={p.publicUrl}
                      alt={p.caption || 'Work sample'}
                      style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                    />
                    {p.caption && (
                      <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact note - ONLY if show_contact is true */}
          {card.show_contact && card.contact ? (
            <div
              style={{
                padding: '1.1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--pastel-lilac)',
                color: '#2d2850',
                marginTop: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                <span>📞</span>
                <span>How to contact {card.card_name}</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 700 }}>
                {card.contact}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Skill Proof Level */}
      <SkillProofLevel
        card={card}
        photos={photos}
        vouches={vouches}
        showNextStep={false}
      />

      {/* What people say (Vouches) */}
      <div className="card-box" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          {t('whatPeopleSay', 'What people say')} ({vouches.length})
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Real recommendations from customers, employers and fellow workers.
        </p>

        {vouches.length === 0 ? (
          <div className="state-box" style={{ padding: '1.5rem' }}>
            <span className="state-icon">🤝</span>
            <p className="state-title" style={{ fontSize: '1.1rem' }}>No vouches yet</p>
            <p className="state-desc" style={{ fontSize: '0.875rem' }}>
              Be the first person to vouch for {card.card_name}!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {vouches.map((v) => {
              const isMyVouch = userVouch && userVouch.id === v.id;
              return (
                <div
                  key={v.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isMyVouch ? 'var(--pastel-lilac)' : 'var(--bg-subtle)',
                    border: `1px solid ${isMyVouch ? 'var(--border-focus)' : 'var(--border-color)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      {isMyVouch && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--btn-text)' }}>
                          (Your vouch)
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    &ldquo;{v.comment}&rdquo;
                  </p>

                  {isMyVouch && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={handleDeleteMyVouch}
                        disabled={deletingVouch}
                        className="btn btn-danger-soft btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', minHeight: '30px' }}
                      >
                        {deletingVouch ? 'Removing...' : 'Remove my vouch'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Vouch Box Form */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          {isOwner ? (
            <div className="banner banner-info" style={{ margin: 0 }}>
              <span>ℹ️</span>
              <span>This is your card. Share your link with customers or colleagues to get vouches.</span>
            </div>
          ) : userVouch ? (
            <div className="banner banner-success" style={{ margin: 0 }}>
              <span>✓</span>
              <span>You have vouched for {card.card_name}. Thank you for supporting honest work!</span>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                {t('workedWith', 'Worked with')} {card.card_name}?
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Leave a quick vouch in 140 characters. One vouch per person. No sign-up hassle.
              </p>

              <form onSubmit={handleVouchSubmit}>
                {/* Relation Choice */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem' }}>
                    How do you know {card.card_name}?
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['Customer', 'Colleague', 'Employer'].map((rel) => {
                      const isSelected = relation === rel;
                      return (
                        <button
                          type="button"
                          key={rel}
                          onClick={() => setRelation(rel)}
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: '1 1 100px' }}
                        >
                          <span>{isSelected ? '●' : '○'}</span>
                          <span>{rel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="vouch-comment" className="form-label" style={{ fontSize: '0.9rem' }}>
                    Your vouch (max 140 characters)
                  </label>
                  <textarea
                    id="vouch-comment"
                    className="form-textarea"
                    maxLength={140}
                    placeholder={`e.g. ${card.card_name} fixed our water leakage on Sunday. Polite, arrived on time and charged fairly.`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                  <span className="char-counter">
                    {140 - comment.length} characters left
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingVouch || !comment.trim()}
                  style={{ width: '100%' }}
                >
                  {submittingVouch ? (
                    <>
                      <span className="spinner"></span>
                      <span>Adding your vouch...</span>
                    </>
                  ) : (
                    <>
                      <span>🤝</span>
                      <span>{t('vouchFor', 'Vouch for')} {card.card_name}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Photo viewing */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <img
              src={activePhoto.publicUrl}
              alt={activePhoto.caption || 'Work preview'}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
            {activePhoto.caption && (
              <p style={{ padding: '0.75rem 1rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {activePhoto.caption}
              </p>
            )}
            <div style={{ padding: '0.5rem 1rem', textAlign: 'right', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
