import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Scissors, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight,
  Flame,
  BadgeCheck,
  UserCheck
} from 'lucide-react';
import { dummySalonSettings, dummyBarbers, dummyServices, dummyQueueTokens } from '../data/dummyData';

export default function HomePage() {
  const { t, language } = useLanguage();
  const [existingToken, setExistingToken] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('salon_active_token');
    if (saved) {
      try {
        setExistingToken(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved token', e);
      }
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-lg mx-auto px-4 py-6 sm:py-8">
      <div className="space-y-6">
        {/* Salon Brand Header & Open Status */}
        <div className="bg-charcoal-800/90 rounded-3xl p-6 border border-charcoal-700 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle gold decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('home.welcome')}</span>
            </div>

            {/* Opening Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{dummySalonSettings.isQueueOpen ? t('salon.open') : t('salon.closed')}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {language === 'gu' ? dummySalonSettings.salonNameGu : dummySalonSettings.salonName}
          </h1>
          <p className="text-xs sm:text-sm text-gold-400/90 font-medium mt-1">
            {language === 'gu' ? dummySalonSettings.taglineGu : dummySalonSettings.tagline}
          </p>
          <div className="mt-2 text-[11px] text-gray-400">
            {t('salon.hours')}
          </div>

          {/* Current Queue Status Snapshot Card */}
          <div className="mt-5 pt-4 border-t border-charcoal-700/80 grid grid-cols-3 gap-2 text-center">
            <div className="bg-charcoal-900/80 rounded-2xl p-2.5 border border-charcoal-700">
              <div className="text-[11px] text-gray-400 font-medium">{t('salon.waitingCount')}</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                {dummySalonSettings.currentlyWaiting}
              </div>
            </div>

            <div className="bg-charcoal-900/80 rounded-2xl p-2.5 border border-charcoal-700">
              <div className="text-[11px] text-gray-400 font-medium">{t('salon.avgWait')}</div>
              <div className="text-xl sm:text-2xl font-black text-gold-400 mt-0.5">
                ~{dummySalonSettings.avgWaitMinutes}<span className="text-xs font-normal">m</span>
              </div>
            </div>

            <div className="bg-charcoal-900/80 rounded-2xl p-2.5 border border-charcoal-700">
              <div className="text-[11px] text-gray-400 font-medium">{t('salon.chairsActive')}</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                {dummySalonSettings.activeBarbersCount}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Active Token Banner (if customer previously joined) */}
        {existingToken && (
          <div className="bg-gradient-to-r from-gold-500/20 via-gold-500/10 to-charcoal-800 rounded-2xl p-4 border border-gold-500/40 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center font-black text-sm border border-gold-500/30">
                #{existingToken.tokenNumber}
              </div>
              <div>
                <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wide">
                  Your Active Token
                </span>
                <div className="text-xs font-semibold text-white">
                  {existingToken.customerName} • ~{existingToken.estimatedWaitMinutes || 20}m wait
                </div>
              </div>
            </div>
            <Link
              to="/status"
              className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-bold text-xs transition shadow"
            >
              View Status
            </Link>
          </div>
        )}

        {/* PROMINENT "JOIN QUEUE" CTA BUTTON */}
        <div className="space-y-3">
          <Link
            to="/join"
            id="join-queue-cta-btn"
            className="group relative w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 hover:from-gold-400 hover:to-gold-300 text-charcoal-900 font-black text-base sm:text-lg tracking-wide transition-all duration-300 shadow-xl shadow-gold-500/20 hover:shadow-gold-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal-900/90 text-gold-400 flex items-center justify-center shadow-inner">
                <Scissors className="w-5 h-5 transform -rotate-45" />
              </div>
              <div className="text-left">
                <div className="leading-tight">{t('home.joinCta')}</div>
                <div className="text-[11px] font-semibold text-charcoal-800/80">
                  Select services & get your instant token
                </div>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1.5 transition-transform" />
          </Link>

          {/* Secondary Track Token Link */}
          <div className="text-center">
            <span className="text-xs text-gray-400">{t('home.haveToken')} </span>
            <Link
              to="/status"
              className="text-xs font-bold text-gold-400 hover:text-gold-300 underline underline-offset-4 decoration-gold-500/40 transition"
            >
              {t('home.trackToken')}
            </Link>
          </div>
        </div>

        {/* Stylists on Duty (Ravi, Amit, Imran) */}
        <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gold-400" />
              <span>{t('home.stylistsOnDuty')}</span>
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              3 Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {dummyBarbers.map((barber) => (
              <div
                key={barber.id}
                className="bg-charcoal-900 rounded-2xl p-3 border border-charcoal-700/80 text-center hover:border-gold-500/40 transition group"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-charcoal-800 border border-gold-500/30 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                  {barber.avatar}
                </div>
                <div className="mt-2 text-sm font-bold text-white">
                  {language === 'gu' ? barber.nameGu : barber.name}
                </div>
                <div className="text-[11px] text-gold-400 font-semibold">
                  Chair #{barber.chair}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {barber.experience}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Services Quick Preview */}
        <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{t('home.popularServices')}</span>
            </h2>
            <Link to="/join" className="text-xs font-bold text-gold-400 hover:underline">
              View All ({dummyServices.length})
            </Link>
          </div>

          <div className="divide-y divide-charcoal-700/60">
            {dummyServices.slice(0, 3).map((srv) => (
              <div key={srv.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">
                    {language === 'gu' ? srv.name_gu : srv.name_en}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {srv.duration} {t('salon.mins')}
                  </div>
                </div>
                <div className="text-xs font-black text-gold-400">
                  {t('salon.currency')}{srv.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works (3 Simple Steps) */}
        <div className="bg-charcoal-800/60 rounded-3xl p-5 border border-charcoal-700/70 text-left">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {t('home.howItWorks')}
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2">
              <div className="w-7 h-7 mx-auto rounded-full bg-gold-500/20 text-gold-400 font-bold text-xs flex items-center justify-center border border-gold-500/30 mb-1.5">
                1
              </div>
              <div className="text-xs font-bold text-white">{t('home.step1Title')}</div>
              <div className="text-[10px] text-gray-400 mt-1 leading-snug">Max 3 services</div>
            </div>
            <div className="p-2">
              <div className="w-7 h-7 mx-auto rounded-full bg-gold-500/20 text-gold-400 font-bold text-xs flex items-center justify-center border border-gold-500/30 mb-1.5">
                2
              </div>
              <div className="text-xs font-bold text-white">{t('home.step2Title')}</div>
              <div className="text-[10px] text-gray-400 mt-1 leading-snug">Digital token</div>
            </div>
            <div className="p-2">
              <div className="w-7 h-7 mx-auto rounded-full bg-gold-500/20 text-gold-400 font-bold text-xs flex items-center justify-center border border-gold-500/30 mb-1.5">
                3
              </div>
              <div className="text-xs font-bold text-white">{t('home.step3Title')}</div>
              <div className="text-[10px] text-gray-400 mt-1 leading-snug">Relax & style</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-[11px] text-gray-500 pb-2">
        <span>© {new Date().getFullYear()} {dummySalonSettings.salonName}. All rights reserved.</span>
      </footer>
    </div>
  );
}
