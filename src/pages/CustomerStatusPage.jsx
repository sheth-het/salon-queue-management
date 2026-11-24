import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useQueue } from '../contexts/QueueContext';
import { 
  evaluateCustomerState, 
  calculateDynamicWaitTime, 
  playChime 
} from '../lib/queueRules';
import { dummyQueueTokens, dummyBarbers } from '../data/dummyData';
import { 
  Clock, 
  RefreshCw, 
  Scissors, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Phone,
  Flame,
  Volume2,
  Navigation,
  X,
  Trash2,
  Sparkles,
  Sliders
} from 'lucide-react';

export default function CustomerStatusPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { queue, cancelToken } = useQueue();

  // Active Token state
  const [token, setToken] = useState(null);
  const [queuePosition, setQueuePosition] = useState(2); // default to 2 (second in line) to immediately showcase "Start coming"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync token from queue if available, else localStorage
  useEffect(() => {
    const saved = localStorage.getItem('salon_active_token');
    let localTok = null;
    if (saved) {
      try {
        localTok = JSON.parse(saved);
      } catch (e) {}
    }

    if (localTok) {
      // Find latest live token state from shared queue
      const liveToken = queue.find(
        (t) => t.id === localTok.id || t.tokenNumber === localTok.tokenNumber
      );
      if (liveToken) {
        setToken(liveToken);
        // Calculate position among waiting tokens
        const waitingTokens = queue.filter(
          (t) => t.status === 'waiting' || t.status === 'called'
        );
        const idx = waitingTokens.findIndex((t) => t.id === liveToken.id);
        const pos = idx >= 0 ? idx + 1 : 1;
        setQueuePosition(liveToken.status === 'called' ? 1 : pos);
      } else {
        setToken(localTok);
        setQueuePosition(localTok.position || 2);
      }
    } else {
      loadDefaultSample();
    }
  }, [queue]);

  const loadDefaultSample = () => {
    // S-2 sample token (Second in line)
    const sample = {
      id: 'tok-sample-2',
      tokenNumber: 'S-2',
      customerName: 'Jignesh Shah',
      phone: '9825123456',
      services: ['Signature Haircut', 'Beard Trim & Shape'],
      totalDuration: 50,
      totalPrice: 350,
      barberId: 'barber-amit',
      barberName: 'Amit',
      chair: 2,
      status: 'waiting',
      position: 2,
      estimatedWaitMinutes: 12,
      joinedAt: '11:30 AM'
    };
    setToken(sample);
    setQueuePosition(2);
  };

  // Evaluate the customer state using our reusable queue rules engine
  const stateEvaluation = evaluateCustomerState({
    token,
    queuePosition
  });

  // Trigger audio chime if state changed to "It's your turn"
  useEffect(() => {
    if (stateEvaluation.code === 'its_your_turn' && soundEnabled) {
      playChime();
    }
  }, [stateEvaluation.code, soundEnabled]);

  // Handle Refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Confirm cancel action
  const handleConfirmCancel = () => {
    if (token && cancelToken) {
      cancelToken(token.id);
    }
    localStorage.removeItem('salon_active_token');
    setShowCancelModal(false);
    navigate('/');
  };

  // Demo simulator helper to test any state on demand
  const setDemoState = (newStatus, newPos, waitMins) => {
    setQueuePosition(newPos);
    setToken((prev) => ({
      ...prev,
      status: newStatus,
      position: newPos,
      estimatedWaitMinutes: waitMins
    }));
  };

  if (!token) return null;

  const peopleAhead = Math.max(0, queuePosition - 1);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Top Breadcrumb Navigation & Live Pulse */}
      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-4 px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gold-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{t('status.liveConnected')}</span>
        </span>
      </div>

      {/* Screen Title */}
      <div className="mb-4 text-center">
        <span className="text-[11px] font-bold text-gold-400 uppercase tracking-widest">
          {t('status.screenTitle')}
        </span>
      </div>

      {/* ============================================================ */}
      {/* STATE NOTICES & CALLOUT BANNERS                              */}
      {/* ============================================================ */}

      {/* 1. "IT'S YOUR TURN" STATE (When receptionist calls customer) */}
      {stateEvaluation.code === 'its_your_turn' && (
        <div 
          id="state-its-your-turn-banner"
          className="mb-5 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/25 via-gold-500/20 to-emerald-500/25 border-2 border-gold-400 shadow-2xl shadow-gold-500/20 animate-gold-pulse text-center"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gold-500 text-charcoal-900 flex items-center justify-center font-black text-xl mb-2 shadow-lg animate-bounce">
            🔔
          </div>
          <div className="text-xl font-black text-white tracking-wide">
            {language === 'gu' ? stateEvaluation.titleGu : stateEvaluation.titleEn}
          </div>
          <p className="text-xs text-gold-300 font-semibold mt-1">
            {language === 'gu' ? stateEvaluation.descGu : stateEvaluation.descEn}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-900/90 text-gold-400 text-xs font-bold border border-gold-500/40">
            <span>Stylist: {token.barberName}</span>
            <span>•</span>
            <span className="text-emerald-400">Chair #{token.chair || 1}</span>
          </div>
        </div>
      )}

      {/* 2. "START COMING" STATE (When customer is 2nd in line) */}
      {stateEvaluation.code === 'start_coming' && (
        <div 
          id="state-start-coming-banner"
          className="mb-5 p-5 rounded-3xl bg-gradient-to-r from-amber-500/25 via-gold-500/20 to-amber-500/25 border-2 border-gold-400 shadow-xl shadow-gold-500/15 text-center animate-pulse"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 text-charcoal-900 flex items-center justify-center font-black text-xl mb-2 shadow-md">
            ⚡
          </div>
          <div className="text-xl font-black text-white tracking-wide">
            {language === 'gu' ? stateEvaluation.titleGu : stateEvaluation.titleEn}
          </div>
          <p className="text-xs text-amber-200 font-semibold mt-1">
            {language === 'gu' ? stateEvaluation.descGu : stateEvaluation.descEn}
          </p>
          <div className="mt-2 text-[11px] text-gray-300">
            You have <strong className="text-gold-400">1 customer ahead</strong>. Arrive at the waiting lounge now.
          </div>
        </div>
      )}

      {/* 3. "WAITING" STATE (When customer is position > 2) */}
      {stateEvaluation.code === 'waiting' && (
        <div 
          id="state-waiting-banner"
          className="mb-5 p-4 rounded-3xl bg-charcoal-800/80 border border-charcoal-700 text-center text-xs text-gray-400"
        >
          <span>{t('status.waitingDesc')}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN HERO TOKEN CARD                                         */}
      {/* ============================================================ */}
      <div className="bg-charcoal-800 rounded-3xl p-6 border-2 border-gold-500/80 shadow-2xl shadow-gold-500/10 text-center relative overflow-hidden">
        {/* Decorative gold shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>

        <div>
          <span className="text-[11px] uppercase font-bold tracking-widest text-gray-400">
            {t('status.yourToken')}
          </span>

          {/* S-1, S-2, S-3 Token Number Format */}
          <div 
            id="token-number-display"
            className="text-6xl font-black text-gold-400 tracking-tight my-2 drop-shadow-md"
          >
            {token.tokenNumber}
          </div>

          <div className="text-base font-bold text-white mb-2">
            {token.customerName}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mt-1">
            <span
              id="status-badge-pill"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                stateEvaluation.code === 'its_your_turn'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 animate-pulse'
                  : stateEvaluation.code === 'start_coming'
                  ? 'bg-gold-500/20 text-gold-300 border-gold-400'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
              <span>{language === 'gu' ? stateEvaluation.badgeGu : stateEvaluation.badgeEn}</span>
            </span>
          </div>
        </div>

        {/* ========================================================== */}
        {/* REAL-TIME QUEUE METRICS GRID                                */}
        {/* ========================================================== */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-charcoal-700/80 text-left">
          {/* Position in Line */}
          <div className="bg-charcoal-900 rounded-2xl p-3.5 border border-charcoal-700">
            <div className="text-[11px] text-gray-400 font-medium">
              {t('status.queuePosition')}
            </div>
            <div 
              id="queue-position-display"
              className="text-2xl font-black text-white mt-0.5"
            >
              #{queuePosition}
            </div>
            <div className="text-[11px] text-gold-400 font-semibold mt-0.5">
              {peopleAhead === 0 ? 'Next in line!' : `${peopleAhead} people ahead`}
            </div>
          </div>

          {/* Estimated Waiting Time */}
          <div className="bg-charcoal-900 rounded-2xl p-3.5 border border-charcoal-700">
            <div className="text-[11px] text-gray-400 font-medium">
              {t('status.estWaitTime')}
            </div>
            <div 
              id="wait-time-display"
              className="text-2xl font-black text-gold-400 mt-0.5 flex items-baseline gap-0.5"
            >
              ~{token.estimatedWaitMinutes || 12}
              <span className="text-xs font-normal text-gray-400">mins</span>
            </div>
            <div className="text-[11px] text-gray-400 font-medium mt-0.5">
              Recalculating live
            </div>
          </div>
        </div>

        {/* Assigned Stylist Info */}
        <div className="mt-3 bg-charcoal-900 rounded-2xl p-3.5 border border-charcoal-700 text-left flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-400 font-medium">
              {t('status.assignedStylist')}
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {token.barberName}
            </div>
          </div>
          <span className="text-xs font-bold text-gold-400 bg-charcoal-800 px-3 py-1.5 rounded-xl border border-charcoal-700">
            {token.chair ? `Chair #${token.chair}` : 'Chair 1'}
          </span>
        </div>

        {/* Booked Services Summary */}
        <div className="mt-3 bg-charcoal-900/60 rounded-2xl p-3.5 border border-charcoal-700/60 text-left space-y-1.5">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {t('status.bookedServices')}
          </div>
          <div className="text-xs font-semibold text-gray-200">
            {Array.isArray(token.services) ? token.services.join(' • ') : token.services}
          </div>
          <div className="pt-1.5 border-t border-charcoal-700/60 flex justify-between text-xs">
            <span className="text-gray-400">{t('status.estDuration')}: {token.totalDuration || 30} mins</span>
            <span className="font-bold text-gold-400">{t('status.counterPrice')}: {t('salon.currency')}{token.totalPrice || 200}</span>
          </div>
        </div>

        {/* ========================================================== */}
        {/* ACTIONS: Refresh & CANCEL MY SPOT BUTTON                   */}
        {/* ========================================================== */}
        <div className="mt-6 flex flex-col gap-2.5">
          {/* Refresh button */}
          <button
            type="button"
            id="refresh-status-btn"
            onClick={handleRefresh}
            className="w-full py-3 rounded-2xl bg-charcoal-700 hover:bg-charcoal-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-charcoal-600 transition active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing Queue...' : t('status.refreshBtn')}</span>
          </button>

          {/* SPEC REQUIREMENT: "Cancel my spot button with a confirmation dialog" */}
          <button
            type="button"
            id="cancel-spot-trigger-btn"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('status.cancelSpotBtn')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CANCEL MY SPOT CONFIRMATION DIALOG MODAL                     */}
      {/* ============================================================ */}
      {showCancelModal && (
        <div 
          id="cancel-confirmation-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-charcoal-800 w-full max-w-sm rounded-3xl p-6 border-2 border-rose-500/60 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-white">
                {t('status.cancelDialogTitle')}
              </h3>

              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                {t('status.cancelDialogDesc')}
              </p>

              <div className="my-4 p-3 rounded-2xl bg-charcoal-900 border border-charcoal-700 text-xs text-gray-400">
                Token to cancel: <strong className="text-gold-400 font-black">#{token.tokenNumber}</strong> ({token.customerName})
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  id="confirm-cancel-spot-btn"
                  onClick={handleConfirmCancel}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-rose-600/20 active:scale-[0.98]"
                >
                  {t('status.confirmCancel')}
                </button>

                <button
                  type="button"
                  id="dismiss-cancel-dialog-btn"
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 font-semibold text-xs transition"
                >
                  {t('status.keepSpot')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* INTERACTIVE DEMO SIMULATOR TOOLBAR                           */}
      {/* Allows testing all 4 queue states on demand without backend  */}
      {/* ============================================================ */}
      <div className="mt-8 bg-charcoal-800/90 rounded-3xl p-4 border border-charcoal-700 shadow-xl">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('status.simulatorTitle')}</span>
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
              soundEnabled ? 'text-gold-400 border-gold-500/40' : 'text-gray-500 border-charcoal-600'
            }`}
            title="Toggle Chime Sound"
          >
            <Volume2 className="w-3 h-3" />
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mb-3">
          Click below to test and demonstrate each queue status transition in real-time:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* 1. Simulate Position 3 (Waiting) */}
          <button
            type="button"
            id="simulate-position-3-btn"
            onClick={() => setDemoState('waiting', 3, 25)}
            className={`p-2 rounded-xl border text-left transition font-semibold ${
              queuePosition === 3 && token.status === 'waiting'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-charcoal-600'
            }`}
          >
            <div>1. {t('status.simulateWaiting')}</div>
            <span className="text-[10px] text-gray-400 block mt-0.5">2 people ahead</span>
          </button>

          {/* 2. Simulate Position 2 ("Start coming" state) */}
          <button
            type="button"
            id="simulate-position-2-btn"
            onClick={() => setDemoState('waiting', 2, 12)}
            className={`p-2 rounded-xl border text-left transition font-semibold ${
              queuePosition === 2 && token.status === 'waiting'
                ? 'bg-gold-500/20 text-gold-300 border-gold-400 ring-1 ring-gold-400'
                : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-charcoal-600'
            }`}
          >
            <div className="text-gold-400">2. {t('status.simulateStartComing')}</div>
            <span className="text-[10px] text-gray-400 block mt-0.5">1 person ahead</span>
          </button>

          {/* 3. Simulate Called ("It's your turn" state) */}
          <button
            type="button"
            id="simulate-called-btn"
            onClick={() => setDemoState('called', 1, 0)}
            className={`p-2 rounded-xl border text-left transition font-semibold ${
              token.status === 'called'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 ring-1 ring-emerald-400'
                : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-charcoal-600'
            }`}
          >
            <div className="text-emerald-400">3. {t('status.simulateTurn')}</div>
            <span className="text-[10px] text-gray-400 block mt-0.5">Receptionist calls</span>
          </button>

          {/* 4. Simulate In Service */}
          <button
            type="button"
            id="simulate-service-btn"
            onClick={() => setDemoState('in_service', 1, 0)}
            className={`p-2 rounded-xl border text-left transition font-semibold ${
              token.status === 'in_service'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-charcoal-600'
            }`}
          >
            <div>4. {t('status.simulateInService')}</div>
            <span className="text-[10px] text-gray-400 block mt-0.5">Sitting in chair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
