import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Scissors, 
  Menu, 
  X, 
  Home,
  Smartphone,
  Clock,
  Layers
} from 'lucide-react';

export default function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainLinks = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/join', label: t('nav.customerJoin'), icon: Smartphone },
    { to: '/status', label: t('nav.customerStatus'), icon: Clock },
  ];

  return (
    <header className="sticky top-0 z-50 bg-charcoal-900/95 backdrop-blur border-b border-charcoal-700/80 shadow-md">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 p-0.5 flex items-center justify-center shadow-lg shadow-gold-500/10">
              <div className="w-full h-full bg-charcoal-900 rounded-[10px] flex items-center justify-center group-hover:bg-charcoal-800 transition">
                <Scissors className="w-4 h-4 text-gold-400 transform -rotate-45" />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-none">
                {t('salon.name')}
              </span>
              <span className="text-[10px] text-gold-400/90 font-bold tracking-wider uppercase">
                Salon Queue System
              </span>
            </div>
          </NavLink>

          {/* Right Controls: Language Switcher & Quick Navigation */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-charcoal-800 text-gray-300 hover:text-gold-400 border border-charcoal-700 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="bg-charcoal-800 border-b border-charcoal-700 px-4 py-3 space-y-1 max-w-lg mx-auto animate-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
            Navigation
          </div>
          {mainLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-gold-500 text-charcoal-900'
                      : 'text-gray-300 hover:bg-charcoal-700 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}
