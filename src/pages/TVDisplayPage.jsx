import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dummyBarbers, dummyQueueTokens } from '../data/dummyData';
import { Tv, Scissors, Bell, Maximize, Clock, Volume2 } from 'lucide-react';

export default function TVDisplayPage() {
  const { t } = useLanguage();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
      console.warn("Audio Context not allowed without interaction", e);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-900 text-white flex flex-col p-4 sm:p-6 lg:p-8 select-none">
      {/* TV Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-charcoal-700/80 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/40 shadow-lg shadow-gold-500/10">
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('salon.name')}
            </h1>
            <span className="text-xs text-gold-400 font-semibold tracking-wider uppercase">
              LIVE QUEUE DISPLAY • સ્ક્રીન 5
            </span>
          </div>
        </div>

        {/* TV Digital Clock & Chime tester */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleTestChime}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-600 text-xs text-gold-400"
            title="Test calling chime"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Chime</span>
          </button>
          <div className="text-right">
            <div className="text-2xl font-black font-mono text-gold-400">{time}</div>
            <div className="text-[11px] text-gray-400">Waiting Area Display</div>
          </div>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65% Panel: Now Serving Grid */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              Now Serving / અત્યારે સેવા ચાલુ છે
            </h2>
            <span className="text-xs text-gray-400 font-semibold">Active Chairs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {dummyBarbers.slice(0, 4).map((barber) => {
              const isCalling = barber.activeToken === 'A-102';
              return (
                <div
                  key={barber.id}
                  className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                    isCalling
                      ? 'bg-charcoal-800 border-2 border-gold-400 animate-gold-pulse'
                      : barber.activeToken
                      ? 'bg-charcoal-800 border border-charcoal-700'
                      : 'bg-charcoal-800/40 border border-charcoal-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                      Chair #{barber.chair} • {barber.name}
                    </span>
                    {isCalling ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gold-500 text-charcoal-900 animate-bounce">
                        CALLING NOW
                      </span>
                    ) : barber.activeToken ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        SERVING
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-charcoal-700 text-gray-400">
                        VACANT
                      </span>
                    )}
                  </div>

                  <div className="my-6 text-center">
                    {barber.activeToken ? (
                      <>
                        <div className="text-5xl sm:text-6xl font-black text-gold-400 tracking-tight">
                          #{barber.activeToken}
                        </div>
                        <div className="text-lg font-bold text-white mt-1">
                          {barber.customerName}
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-bold text-gray-600 tracking-wider">
                        ---
                      </div>
                    )}
                  </div>

                  <div className="text-center text-xs text-gray-400">
                    {barber.status === 'break' ? 'Barber on short break' : 'Please proceed when token appears'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 35% Panel: Up Next Queue */}
        <div className="lg:col-span-4 bg-charcoal-800 rounded-2xl p-5 border border-charcoal-700 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-charcoal-700">
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Up Next / પછીનો વારો
            </h3>
            <span className="text-xs text-gold-400 font-bold">Est. Wait</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {dummyQueueTokens.filter(t => t.status === 'waiting').map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-700"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-charcoal-800 text-gold-400 text-xs font-bold flex items-center justify-center border border-charcoal-700">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-base font-black text-white">#{item.tokenNumber}</div>
                    <div className="text-xs text-gray-400">{item.customerName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gold-400">~{item.estimatedWaitMinutes || 20}m</div>
                  <div className="text-[10px] text-gray-500 uppercase">{item.barberName}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bilingual Ticker Notice */}
          <div className="mt-4 pt-3 border-t border-charcoal-700/80 text-center text-xs text-gold-400 font-medium">
            Please arrive in waiting area when you are next in line.
          </div>
        </div>
      </div>
    </div>
  );
}
