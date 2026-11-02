import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <p className="footer-honest-note">
        {t('honestNote', 'Honest Note: Skills are self-reported and vouched by people. Hunar Card does not verify skills or guarantee jobs.')}
      </p>
      <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
        Hunar Card • Built for workers and honest work
      </p>
    </footer>
  );
}
