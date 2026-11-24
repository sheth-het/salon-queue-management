import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQueue } from '../contexts/QueueContext';
import { 
  Tv, 
  Scissors, 
  Bell, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Maximize, 
  Coffee 
} from 'lucide-react';
import { playChime } from '../lib/queueRules';

export default function TVDisplayPage() {
  const { t, language } = useLanguage();
  const { 
    barbers, 
    queue, 
    getActiveCustomerForBarber, 
    getUpcomingTokens, 
    lastCalledToken 
  } = useQueue();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  );
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Digital clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic sound chime on newly called token
  useEffect(() => {
    if (lastCalledToken && soundEnabled) {
      playChime();
    }
  }, [lastCalledToken, soundEnabled]);

  // Upcoming tokens (shows up to 8 with scroll support for larger queues)
  const totalWaiting = queue.filter(t => t.status === 'waiting').length;
  const upcomingTokens = getUpcomingTokens(8);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-charcoal-900 text-white flex flex-col p-4 sm:p-6 lg:p-8 select-none font-sans">
      {/* TV Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-charcoal-700/80 mb-6 gap-4">
        {/* Salon Branding */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 p-0.5 flex items-center justify-center shadow-2xl shadow-gold-500/20">
            <div className="w-full h-full bg-charcoal-900 rounded-[14px] flex items-center justify-center">
              <Scissors className="w-7 h-7 text-gold-400 transform -rotate-45" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {t('salon.name')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-gold-400 font-extrabold tracking-widest uppercase">
                LIVE WAITING AREA TV DISPLAY • સ્ક્રીન 6
              </span>
            </div>
          </div>
        </div>

        {/* Center Bilingual Ticker Message */}
        <div className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-2xl bg-charcoal-800 border border-charcoal-700 text-xs text-gold-300 font-bold max-w-md text-center">
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
          <span>Please proceed immediately to the chair when your token number flashes in gold!</span>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-4">
          {/* Audio Chime Mute/Unmute */}
          <button
            type="button"
            id="tv-sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-charcoal-800 border-gold-500/40 text-gold-400 hover:bg-charcoal-700'
                : 'bg-charcoal-800 border-charcoal-700 text-gray-500 hover:text-gray-300'
            }`}
            title="Toggle TV calling audio chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            id="tv-fullscreen-btn"
            onClick={toggleFullScreen}
            className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-gray-300 hover:text-white transition"
            title="Toggle Fullscreen (F11)"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Clock Display */}
          <div className="text-right">
            <div 
              id="tv-digital-clock"
              className="text-2xl sm:text-3xl font-black font-mono text-gold-400 tracking-tight"
            >
              {currentTime}
            </div>
            <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              {currentDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============================================================ */}
        {/* LEFT 65% PANEL: NOW SERVING GRID (EACH BARBER'S CUSTOMER)    */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Now Serving / અત્યારે સેવા ચાલુ છે</span>
              </h2>
              <span className="text-xs font-bold text-gray-400 tracking-wider">
                3 STYLIST CHAIRS
              </span>
            </div>

            {/* Barber Chairs Grid (Ravi, Amit, Imran) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {barbers.map((barber) => {
                const activeCustomer = getActiveCustomerForBarber(barber.id);
                const isCalling = activeCustomer && activeCustomer.status === 'called';
                const isServing = activeCustomer && activeCustomer.status === 'in_service';
                const isOnBreak = barber.status === 'break';

                return (
                  <div
                    key={barber.id}
                    id={`tv-chair-card-${barber.chair}`}
                    className={`relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between min-h-[300px] shadow-2xl ${
                      isCalling
                        ? 'bg-gradient-to-b from-charcoal-800 to-charcoal-900 border-gold-400 animate-gold-pulse ring-2 ring-gold-400/50'
                        : isServing
                        ? 'bg-charcoal-800 border-emerald-500/70 shadow-emerald-500/10'
                        : isOnBreak
                        ? 'bg-charcoal-800/60 border-amber-500/30'
                        : 'bg-charcoal-800/80 border-charcoal-700/80'
                    }`}
                  >
                    {/* Chair Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-gold-400 block">
                            Chair #{barber.chair}
                          </span>
                          <span className="text-base font-black text-white">
                            {barber.name}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isCalling ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-gold-500 text-charcoal-900 animate-bounce shadow-md">
                            CALLING NOW 🔔
                          </span>
                        ) : isServing ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            SERVING
                          </span>
                        ) : isOnBreak ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Coffee className="w-3 h-3" />
                            <span>ON BREAK</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-charcoal-700 text-gray-400">
                            AVAILABLE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Big Typography Serving Token */}
                    <div className="my-auto py-6 text-center">
                      {activeCustomer ? (
                        <>
                          <div 
                            id={`tv-token-display-chair-${barber.chair}`}
                            className={`text-6xl sm:text-7xl font-black tracking-tight drop-shadow-xl ${
                              isCalling ? 'text-gold-300' : 'text-gold-400'
                            }`}
                          >
                            #{activeCustomer.tokenNumber}
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-white mt-2 truncate">
                            {activeCustomer.customerName}
                          </div>
                          <div className="text-xs text-gold-300/80 font-semibold mt-1">
                            {Array.isArray(activeCustomer.services)
                              ? activeCustomer.services.slice(0, 2).join(' + ')
                              : activeCustomer.services}
                          </div>
                        </>
                      ) : (
                        <div className="py-6 text-center">
                          <div className="text-3xl font-black text-gray-600 tracking-wider">
                            ---
                          </div>
                          <span className="text-xs text-gray-500 font-semibold mt-2 block">
                            {isOnBreak ? 'Barber on short break' : 'Chair Vacant'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chair Footnote */}
                    <div className="pt-3 border-t border-charcoal-700/60 text-center text-[11px] text-gray-400">
                      {isCalling ? (
                        <strong className="text-gold-300 animate-pulse">
                          Please proceed to Chair #{barber.chair} now!
                        </strong>
                      ) : isServing ? (
                        <span>Service in progress</span>
                      ) : (
                        <span>Next customer will be called shortly</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom TV News/Announcement Ticker */}
          <div className="mt-6 bg-charcoal-800 rounded-2xl p-4 border border-charcoal-700 flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2 font-bold text-gold-400">
              <Sparkles className="w-4 h-4" />
              <span>Announcements:</span>
            </div>
            <div className="text-xs text-gray-300">
              Free Wi-Fi: <strong>Royal_Guest</strong> • Please settle all payments at the front desk counter after service.
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT 35% PANEL: UP NEXT QUEUE (WAITING TOKENS & WAIT)       */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 bg-charcoal-800 rounded-3xl p-6 border border-charcoal-700 shadow-2xl flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-charcoal-700 shrink-0">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-400" />
                  <span>Up Next / પછીનો વારો</span>
                </h3>
                <span className="text-[11px] text-gray-400">
                  {totalWaiting} {totalWaiting === 1 ? 'customer' : 'customers'} in waiting list
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gold-400 uppercase tracking-wide block">
                  Est. Wait
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Sync</span>
                </span>
              </div>
            </div>

            {/* Upcoming Tokens List */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-230px)] pr-1 flex-1">
              {upcomingTokens.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                  <div className="text-base font-bold text-gray-200">Queue is Clear</div>
                  <div className="text-xs text-gray-500 mt-0.5">No waiting customers right now.</div>
                </div>
              ) : (
                <>
                  {upcomingTokens.map((token, index) => (
                    <div
                      key={token.id}
                      id={`tv-upnext-item-${index + 1}`}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        index === 0
                          ? 'bg-gradient-to-r from-gold-500/20 via-gold-500/10 to-charcoal-900 border-gold-500/70 shadow-lg'
                          : 'bg-charcoal-900/90 border-charcoal-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${
                          index === 0
                            ? 'bg-gold-500 text-charcoal-900 border-gold-500 shadow'
                            : 'bg-charcoal-800 text-gold-400 border-charcoal-700'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-xl font-black text-white tracking-tight">
                            #{token.tokenNumber}
                          </div>
                          <div className="text-xs font-bold text-gray-300">
                            {token.customerName}
                          </div>
                          <div className="text-[10px] text-gold-400/80 font-medium">
                            {token.barberName ? `Pref: ${token.barberName}` : 'Any Stylist'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-gold-400 font-mono">
                          ~{token.calculatedWaitMinutes || 15}m
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">
                          {index === 0 ? 'Next Up' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {totalWaiting > upcomingTokens.length && (
                    <div className="p-2.5 rounded-xl bg-charcoal-900/80 border border-charcoal-700 text-center text-xs text-gold-400/90 font-bold">
                      +{totalWaiting - upcomingTokens.length} more waiting in queue
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* TV Screen Footnote */}
          <div className="mt-6 pt-4 border-t border-charcoal-700/80 text-center text-xs text-gray-400">
            <span className="text-gold-400 font-bold">Tip:</span> Track your live token status on your phone by visiting the salon web link.
          </div>
        </div>
      </div>
    </div>
  );
}
