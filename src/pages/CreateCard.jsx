import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { TRADES, AVAILABILITY_OPTIONS, getTradeByName } from '../data/trades';
import { useLanguage } from '../context/LanguageContext';
import VoiceStoryInput from '../components/VoiceStoryInput';

export default function CreateCard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id') || localStorage.getItem('hunar_my_card_id');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Form State
  const [cardName, setCardName] = useState('');
  const [trade, setTrade] = useState(TRADES[0].name);
  const [yearsExperience, setYearsExperience] = useState(2);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkills, setCustomSkills] = useState([]);
  const [area, setArea] = useState('');
  const [availability, setAvailability] = useState('Full time');
  const [story, setStory] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [showContact, setShowContact] = useState(false);

  // Current active trade object
  const currentTrade = getTradeByName(trade);

  // Load existing card if editing
  useEffect(() => {
    async function loadExistingCard() {
      if (!editId || !isConfigured) return;
      try {
        setFetching(true);
        // Ensure session is restored before querying
        await supabase.auth.getSession();

        const { data, error } = await supabase
          .from('skill_cards')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) {
          console.warn('Could not load card for editing:', error.message);
        } else if (data) {
          setCardName(data.card_name || '');
          setTrade(data.trade || TRADES[0].name);
          setYearsExperience(data.years_experience ?? 2);
          setSelectedSkills(data.skills || []);
          setArea(data.area || '');
          setAvailability(data.availability || 'Full time');
          setStory(data.story || '');
          setContactNote(data.contact || '');
          setShowContact(Boolean(data.show_contact));

          // Extract any skills that are not in the predefined list for this trade
          const tradeDef = getTradeByName(data.trade);
          const custom = (data.skills || []).filter(s => !tradeDef.skills.includes(s));
          if (custom.length > 0) {
            setCustomSkills(custom);
          }
        }
      } catch (err) {
        console.error('Error fetching card:', err);
      } finally {
        setFetching(false);
      }
    }

    loadExistingCard();
  }, [editId]);

  // Set default skills when trade changes if skills are empty
  const handleTradeChange = (newTradeName) => {
    setTrade(newTradeName);
    const newTradeObj = getTradeByName(newTradeName);
    // Keep custom skills, but reset trade-specific skills to top 2 defaults if user had nothing
    if (selectedSkills.length === 0) {
      setSelectedSkills(newTradeObj.skills.slice(0, 2));
    }
  };

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!customSkills.includes(trimmed)) {
      setCustomSkills([...customSkills, trimmed]);
    }
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setCustomSkillInput('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cardName.trim()) {
      setErrorMessage('Please give your card a name. A nickname or first name is great!');
      return;
    }
    if (selectedSkills.length === 0) {
      setErrorMessage('Please pick at least one skill you can do.');
      return;
    }
    if (!area.trim()) {
      setErrorMessage('Please type your town or area so nearby people can find you.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Add your Supabase URL and Key in .env.local to save your card.');
      return;
    }

    try {
      setLoading(true);

      // 1. Ensure user has an anonymous session
      let { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData?.session?.user?.id;

      if (!userId) {
        const { data: authData } = await supabase.auth.getUser();
        userId = authData?.user?.id;
      }

      if (!userId) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          throw new Error(`Could not start your session: ${anonError.message}. Make sure anonymous sign-ins are enabled in Supabase.`);
        }
        userId = anonData?.user?.id;
      }

      if (!userId) {
        throw new Error('Unable to identify your worker account. Please try again.');
      }

      // 2. Prepare payload
      // Privacy rule: contact note stored ONLY if 'show_contact' is true, else null
      const contactToStore = (showContact && contactNote.trim()) ? contactNote.trim() : null;

      const cardPayload = {
        user_id: userId,
        card_name: cardName.trim(),
        trade: trade,
        years_experience: Math.max(0, parseInt(yearsExperience, 10) || 0),
        skills: selectedSkills,
        area: area.trim(),
        availability: availability,
        story: story.trim().slice(0, 140),
        contact: contactToStore,
        show_contact: Boolean(showContact && contactNote.trim()),
      };

      let savedCardId = editId;

      if (editId) {
        const { data, error } = await supabase
          .from('skill_cards')
          .update(cardPayload)
          .eq('id', editId)
          .select()
          .single();

        if (error) throw error;
        savedCardId = data.id;
      } else {
        const { data, error } = await supabase
          .from('skill_cards')
          .insert({
            ...cardPayload,
            is_published: true // default published on creation so workers are discoverable
          })
          .select()
          .single();

        if (error) throw error;
        savedCardId = data.id;
      }

      // Save to localStorage for quick access
      localStorage.setItem('hunar_my_card_id', savedCardId);

      // Move forward to Feature 3: Add Work Proof photos
      navigate(`/work-proof/${savedCardId}`);
    } catch (err) {
      console.error('Error saving skill card:', err);
      setErrorMessage(err.message || 'We could not save your card right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="state-box" style={{ maxWidth: '580px', margin: '2rem auto' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}></div>
        <p className="state-desc">Loading your card details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          {editId ? t('updateYourCard', 'Update your card') : t('makeYourCard', 'Let’s make your card')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          No password, email or ID required. Just honest work and real photos.
        </p>
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="banner banner-error" role="alert">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSave} noValidate>
        {/* 1. Card Name */}
        <div className="card-box">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="card-name-input" className="form-label">
              {t('nameLabel', 'What name should people call you?')} <span style={{ color: '#d33' }}>*</span>
            </label>
            <span className="form-hint">
              {t('nameHint', 'A first name or nickname is fine (e.g., "Ramesh" or "Raju Electrician").')}
            </span>
            <input
              id="card-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              maxLength={60}
            />
          </div>
        </div>

        {/* 2. Trade Picker */}
        <div className="card-box">
          <label className="form-label">
            What is your trade? <span style={{ color: '#d33' }}>*</span>
          </label>
          <span className="form-hint">
            Pick the trade you do best. Each trade has its own soft colour tint.
          </span>
          <div className="trade-grid" role="radiogroup" aria-label="Trade selection">
            {TRADES.map((t) => {
              const isSelected = trade.toLowerCase() === t.name.toLowerCase();
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleTradeChange(t.name)}
                  className={`trade-chip-btn ${isSelected ? 'selected' : ''}`}
                  style={{
                    backgroundColor: isSelected ? t.color : 'var(--bg-card)',
                    borderColor: isSelected ? t.borderColor : 'var(--border-color)',
                    color: '#2d2850'
                  }}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <span className="trade-chip-icon">{t.icon}</span>
                  <span className="trade-chip-title">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Years of Experience */}
        <div className="card-box">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="exp-input" className="form-label">
              How many years have you worked in this trade?
            </label>
            <span className="form-hint">
              Honest experience helps people know what jobs to call you for.
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '240px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
                onClick={() => setYearsExperience(Math.max(0, yearsExperience - 1))}
                aria-label="Decrease years"
              >
                -
              </button>
              <input
                id="exp-input"
                type="number"
                min="0"
                max="50"
                className="form-input"
                style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.15rem' }}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
                onClick={() => setYearsExperience(yearsExperience + 1)}
                aria-label="Increase years"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 4. Skills Checklist & Custom Skill */}
        <div className="card-box">
          <label className="form-label">
            Check the jobs you can do <span style={{ color: '#d33' }}>*</span>
          </label>
          <span className="form-hint">
            Common skills for <strong>{currentTrade.name}</strong>. Tap to select or add your own below.
          </span>

          <div className="skills-grid" style={{ marginBottom: '1.25rem' }}>
            {currentTrade.skills.map((skill) => {
              const isChecked = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`skill-tag-check ${isChecked ? 'checked' : ''}`}
                  role="checkbox"
                  aria-checked={isChecked}
                >
                  <span>{isChecked ? '✓' : '+'}</span>
                  <span>{skill}</span>
                </button>
              );
            })}

            {/* Custom Skills added by worker */}
            {customSkills.map((cSkill) => {
              const isChecked = selectedSkills.includes(cSkill);
              return (
                <button
                  type="button"
                  key={cSkill}
                  onClick={() => toggleSkill(cSkill)}
                  className={`skill-tag-check ${isChecked ? 'checked' : ''}`}
                  style={{ fontStyle: 'italic' }}
                  role="checkbox"
                  aria-checked={isChecked}
                >
                  <span>{isChecked ? '✓' : '+'}</span>
                  <span>{cSkill}</span>
                </button>
              );
            })}
          </div>

          {/* Add my own skill input */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Add another skill you do..."
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill(e);
                }
              }}
              style={{ minHeight: '44px' }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddCustomSkill}
              style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
            >
              + Add
            </button>
          </div>
        </div>

        {/* 5. Town or Area */}
        <div className="card-box">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="area-input" className="form-label">
              Your town or area <span style={{ color: '#d33' }}>*</span>
            </label>
            <span className="form-hint">
              Never an exact address. Just your neighborhood or town so local employers find you.
            </span>
            <input
              id="area-input"
              type="text"
              className="form-input"
              placeholder="e.g. Koramangala, Bengaluru or Andheri East, Mumbai"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
              maxLength={100}
            />
          </div>
        </div>

        {/* 6. Availability */}
        <div className="card-box">
          <label className="form-label">
            When are you available for work?
          </label>
          <span className="form-hint">
            Let employers know your work timing.
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {AVAILABILITY_OPTIONS.map((opt) => {
              const isSelected = availability === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAvailability(opt.id)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: '1 1 140px' }}
                >
                  <span>{isSelected ? '●' : '○'}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Short 'about me' Story (Max 140 chars) */}
        <div className="card-box">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <label htmlFor="story-input" className="form-label" style={{ marginBottom: 0 }}>
                {t('storyLabel', 'A short story in your own words')}
              </label>
              <VoiceStoryInput
                currentText={story}
                onTranscript={(newText) => setStory(newText)}
                maxLength={140}
              />
            </div>
            <span className="form-hint">
              140 characters max. What makes your work reliable?
            </span>
            <textarea
              id="story-input"
              className="form-textarea"
              maxLength={140}
              placeholder="e.g. 5 years fixing wiring faults across south city. Clean work, fast diagnosis and always fair rates."
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
            <span className="char-counter">
              {140 - story.length} characters left
            </span>
          </div>
        </div>

        {/* 8. Contact Note & Privacy Toggle */}
        <div className="card-box">
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="switch-label">
              <input
                type="checkbox"
                className="switch-input"
                checked={showContact}
                onChange={(e) => setShowContact(e.target.checked)}
              />
              <span className="switch-track">
                <span className="switch-thumb"></span>
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)' }}>
                  {t('showContactLabel', 'Show contact on my card')}
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t('showContactHint', 'If turned off, no contact note is stored or shown anywhere.')}
                </span>
              </div>
            </label>
          </div>

          {showContact && (
            <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <label htmlFor="contact-input" className="form-label">
                {t('contactLabel', 'How should people reach you?')}
              </label>
              <span className="form-hint">
                e.g. &quot;WhatsApp me on 9876543210&quot; or &quot;Call between 9 AM and 7 PM&quot;.
              </span>
              <input
                id="contact-input"
                type="text"
                className="form-input"
                placeholder="e.g. Call or WhatsApp at 9876543210"
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                maxLength={120}
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ minHeight: '52px', fontSize: '1.1rem', width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>{t('savingBtn', 'Saving your card...')}</span>
              </>
            ) : (
              <>
                <span>{t('saveBtn', 'Save and add work photos')}</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
