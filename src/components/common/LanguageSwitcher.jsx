import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-500/50 bg-charcoal-800 text-xs font-semibold text-gold-400 hover:bg-gold-500 hover:text-charcoal-900 transition-all duration-200 shadow-sm"
      title="Switch Language / ભાષા બદલો"
    >
      <span className={language === 'en' ? 'text-white font-bold' : 'text-gray-400'}>EN</span>
      <span className="text-gold-500/60">|</span>
      <span className={language === 'gu' ? 'text-white font-bold' : 'text-gray-400'}>ગુજરાતી</span>
    </button>
  );
}
