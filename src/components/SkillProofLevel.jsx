import React, { useState } from 'react';
import { calculateProofScore } from '../utils/proofScore';
import { useLanguage } from '../context/LanguageContext';

export default function SkillProofLevel({
  card,
  photos = [],
  vouches = [],
  showNextStep = false,
  compact = false
}) {
  const { t } = useLanguage();
  const [showRules, setShowRules] = useState(false);

  const scoreData = calculateProofScore(card, photos, vouches);
  const { total, level, levelColor, levelTextColor, nextStep, breakdown } = scoreData;

  // Translated level name
  let translatedLevel = level;
  if (level === 'Getting started') translatedLevel = t('levelGettingStarted', 'Getting started');
  if (level === 'Building trust') translatedLevel = t('levelBuildingTrust', 'Building trust');
  if (level === 'Well proven') translatedLevel = t('levelWellProven', 'Well proven');

  // Compact badge mode for worker cards in Find Workers list
  if (compact) {
    return (
      <div style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: levelColor,
              color: levelTextColor
            }}
          >
            {translatedLevel} • {total}/100
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>
            {t('proofLevelTitle', 'Skill Proof')}
          </span>
        </div>
        <div
          style={{
            height: '6px',
            backgroundColor: 'var(--border-color)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            width: '100%'
          }}
          aria-label={`Skill proof score ${total} of 100`}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, total))}%`,
              backgroundColor: levelColor === 'var(--pastel-mint)' ? '#2fa26e' : levelColor === 'var(--pastel-sky)' ? '#4b88c4' : '#e08f62',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    );
  }

  // Full display mode for My Card & Public Card
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.15rem',
        marginBottom: '1.25rem'
      }}
    >
      {/* Title & Level Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
            {t('proofLevelTitle', 'Skill Proof Level')}
          </strong>
        </div>

        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: levelColor,
            color: levelTextColor,
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          {translatedLevel} • {total}/100
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: '10px',
          backgroundColor: 'var(--border-color)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: '0.6rem',
          position: 'relative'
        }}
        role="progressbar"
        aria-valuenow={total}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, total))}%`,
            backgroundColor: levelColor === 'var(--pastel-mint)' ? '#2fa26e' : levelColor === 'var(--pastel-sky)' ? '#4b88c4' : '#e08f62',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease'
          }}
        />
      </div>

      {/* Required Label */}
      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
        {t('proofDisclaimer', 'Rule-based score, not AI. It shows how much proof this card has.')}
      </p>

      {/* Next Step Tip (for My Card) */}
      {showNextStep && nextStep && (
        <div
          style={{
            marginTop: '0.6rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: total >= 100 ? 'var(--pastel-mint)' : 'var(--pastel-butter)',
            color: '#2d2850',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>{total >= 100 ? '🎉' : '💡'}</span>
          <span>{nextStep}</span>
        </div>
      )}

      {/* Toggle to see exact point rules */}
      <div style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setShowRules(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--btn-text)',
            cursor: 'pointer',
            textDecoration: 'underline',
            minHeight: 'auto'
          }}
        >
          {showRules ? '▲ Hide score rules' : '▼ How is this calculated? (View rules)'}
        </button>

        {showRules && (
          <div
            style={{
              marginTop: '0.6rem',
              paddingTop: '0.6rem',
              borderTop: '1px dashed var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              lineHeight: 1.6
            }}
          >
            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
              <li>
                <strong>10 pts:</strong> Trade & years of experience set ({breakdown.tradeExp}/10)
              </li>
              <li>
                <strong>5 pts each:</strong> Listed skills, max 20 pts ({breakdown.skills}/20)
              </li>
              <li>
                <strong>10 pts each:</strong> Work photo with caption, max 30 pts ({breakdown.photos}/30)
              </li>
              <li>
                <strong>10 pts each:</strong> Vouch from a different person, max 30 pts ({breakdown.vouches}/30)
              </li>
              <li>
                <strong>10 pts:</strong> Town/area and work availability set ({breakdown.areaAvailability}/10)
              </li>
            </ul>
            <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Levels: 0–39 Getting started • 40–69 Building trust • 70–100 Well proven
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
