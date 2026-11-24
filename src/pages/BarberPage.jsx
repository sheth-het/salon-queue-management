import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dummyBarbers, dummyQueueTokens } from '../data/dummyData';
import { UserCheck, Play, CheckCircle, UserX, Bell, Clock, Scissors } from 'lucide-react';

export default function BarberPage() {
  const { t } = useLanguage();
  const [selectedBarberId, setSelectedBarberId] = useState('b-1');
  const [barberStatus, setBarberStatus] = useState('active');

  const currentBarber = dummyBarbers.find((b) => b.id === selectedBarberId) || dummyBarbers[0];
  const activeCustomer = dummyQueueTokens.find((tok) => tok.barberId === selectedBarberId && tok.status === 'in_service');
  const nextInLine = dummyQueueTokens.find((tok) => tok.status === 'waiting');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Station Selector & Shift Toggle */}
      <div className="bg-charcoal-800 rounded-2xl p-5 border border-charcoal-700 shadow-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Screen 4: Barber Station Dashboard</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="bg-charcoal-900 border border-charcoal-600 rounded-xl px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:border-gold-500"
            >
              {dummyBarbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Chair #{b.chair})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Shift Pills */}
        <div className="flex items-center gap-1.5 bg-charcoal-900 p-1.5 rounded-xl border border-charcoal-700">
          {[
            { id: 'active', label: 'Active', color: 'bg-emerald-500 text-charcoal-900' },
            { id: 'break', label: 'On Break', color: 'bg-amber-500 text-charcoal-900' },
            { id: 'off_duty', label: 'Off Duty', color: 'bg-rose-500 text-white' },
          ].map((shift) => (
            <button
              key={shift.id}
              onClick={() => setBarberStatus(shift.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                barberStatus === shift.id ? shift.color : 'text-gray-400 hover:text-white'
              }`}
            >
              {shift.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Currently in Chair */}
        <div className="bg-charcoal-800 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              In Chair (Active Service)
            </span>
            <div className="text-xs font-mono px-2 py-1 rounded bg-charcoal-900 text-gray-300 border border-charcoal-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              <span>18:42 mins</span>
            </div>
          </div>

          {activeCustomer ? (
            <div>
              <div className="text-3xl font-black text-white">{activeCustomer.customerName}</div>
              <div className="text-sm font-bold text-gold-400 mt-1">Token #{activeCustomer.tokenNumber}</div>
              <div className="text-xs text-gray-400 mt-2">
                Services: <strong className="text-gray-200">{activeCustomer.services.join(', ')}</strong>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Joined: {activeCustomer.joinedAt} • Est. Duration: {activeCustomer.totalDuration} mins
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-900 font-bold text-sm tracking-wide transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('actions.completeService')}
                </button>
                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-xs border border-rose-500/30 transition flex items-center justify-center gap-2"
                >
                  <UserX className="w-3.5 h-3.5" />
                  {t('actions.markNoShow')}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              Chair is currently vacant. Call next customer below.
            </div>
          )}
        </div>

        {/* Card 2: Next in Line */}
        <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
              Next In Queue (Waiting)
            </span>
            <span className="text-xs text-gray-400">3 waiting</span>
          </div>

          {nextInLine ? (
            <div>
              <div className="text-2xl font-black text-white">{nextInLine.customerName}</div>
              <div className="text-sm font-bold text-gold-400 mt-1">Token #{nextInLine.tokenNumber}</div>
              <div className="text-xs text-gray-400 mt-2">
                Requested: <strong className="text-gray-200">{nextInLine.services.join(', ')}</strong>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Waiting for: ~{nextInLine.estimatedWaitMinutes || 15} mins
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-bold text-sm tracking-wide transition shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {t('actions.callNext')} (Triggers TV Chime)
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-white font-medium text-xs transition flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 text-gold-400" />
                  {t('actions.startService')}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              No customers currently waiting in queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
