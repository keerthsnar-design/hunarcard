import React from 'react';
import { isConfigured } from '../lib/supabase';

export default function DemoBanner() {
  if (isConfigured) return null;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--alert-warn-bg)',
        color: 'var(--alert-warn-text)',
        borderBottom: '2px solid rgba(220, 160, 0, 0.3)',
        padding: '0.75rem 1.25rem',
        fontSize: '0.925rem',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        textAlign: 'center'
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⚠️</span>
      <span>
        Demo mode - not saved. Supabase keys are not set yet. Changes will not be saved to the database until Supabase is connected in <code>.env.local</code>.
      </span>
    </div>
  );
}
