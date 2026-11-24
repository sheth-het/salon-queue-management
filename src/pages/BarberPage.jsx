import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQueue } from '../contexts/QueueContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  UserCheck, 
  Play, 
  CheckCircle, 
  UserX, 
  Bell, 
  Clock, 
  Scissors, 
  Coffee, 
  Sparkles,
  AlertCircle,
  Phone,
  Power
} from 'lucide-react';

export default function BarberPage() {
  const { t, language } = useLanguage();
  const { 
    barbers, 
    startService, 
    completeService, 
    markNoShow, 
    setBarberStatus, 
    callNextCustomer,
    getActiveCustomerForBarber,
    getNextCustomerForBarber
  } = useQueue();

  // Selected Barber station view (defaults to Ravi)
  const [selectedBarberId, setSelectedBarberId] = useState('barber-ravi');
  const [elapsedTimer, setElapsedTimer] = useState(0);

  const currentBarber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];
  const activeCustomer = getActiveCustomerForBarber(currentBarber.id);
  const nextCustomer = getNextCustomerForBarber(currentBarber.id);

  // Simple live timer ticking for active in-service customer
  useEffect(() => {
    let interval = null;
    if (activeCustomer && activeCustomer.status === 'in_service') {
      interval = setInterval(() => {
        setElapsedTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCustomer?.id, activeCustomer?.status]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallNext = () => {
    callNextCustomer(currentBarber.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Station Selector & Shift Controls */}
      <div className="bg-charcoal-800 rounded-3xl p-5 sm:p-6 border border-charcoal-700 shadow-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gold-400 uppercase tracking-widest">
            <UserCheck className="w-4 h-4" />
            <span>Screen 5 • Barber Station View</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-2xl">{currentBarber.avatar}</span>
            <select
              id="barber-select-dropdown"
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="bg-charcoal-900 border border-charcoal-600 rounded-xl px-3 py-1.5 text-base sm:text-lg font-black text-white focus:outline-none focus:border-gold-500 shadow-inner"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Chair #{b.chair})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Available / On Break / Off Duty Controls */}
        <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Shift Availability Status:
          </span>
          <div className="flex items-center gap-1.5 bg-charcoal-900 p-1.5 rounded-2xl border border-charcoal-700 w-full sm:w-auto justify-between sm:justify-start">
            {/* Available */}
            <button
              type="button"
              id="barber-status-available-btn"
              onClick={() => setBarberStatus(currentBarber.id, 'active')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                currentBarber.status === 'active'
                  ? 'bg-emerald-500 text-charcoal-900 shadow-md shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>Available</span>
            </button>

            {/* On Break */}
            <button
              type="button"
              id="barber-status-break-btn"
              onClick={() => setBarberStatus(currentBarber.id, 'break')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                currentBarber.status === 'break'
                  ? 'bg-amber-500 text-charcoal-900 shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>On Break</span>
            </button>

            {/* Off Duty */}
            <button
              type="button"
              id="barber-status-offduty-btn"
              onClick={() => setBarberStatus(currentBarber.id, 'off_duty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentBarber.status === 'off_duty'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Off Duty</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Current Customer vs Next Customer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* CARD 1: CURRENT CUSTOMER IN CHAIR (WITH START & DONE BUTTONS) */}
        {/* ============================================================ */}
        <div 
          id="barber-current-customer-card"
          className={`bg-charcoal-800 rounded-3xl p-6 border-2 transition-all shadow-xl relative flex flex-col justify-between ${
            activeCustomer
              ? activeCustomer.status === 'in_service'
                ? 'border-emerald-500 shadow-emerald-500/10'
                : 'border-gold-400 shadow-gold-500/15 animate-gold-pulse'
              : 'border-charcoal-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 transform -rotate-45" />
                <span>Current Customer in Chair</span>
              </span>

              {activeCustomer && (
                <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-charcoal-900 text-gray-200 border border-charcoal-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold-400" />
                  <span>
                    {activeCustomer.status === 'in_service'
                      ? formatTimer(elapsedTimer)
                      : 'Waiting to sit'}
                  </span>
                </div>
              )}
            </div>

            {activeCustomer ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl sm:text-5xl font-black text-gold-400 tracking-tight">
                      #{activeCustomer.tokenNumber}
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                        activeCustomer.status === 'in_service'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-gold-500/20 text-gold-300 border-gold-400 animate-pulse'
                      }`}
                    >
                      {activeCustomer.status === 'in_service' ? 'IN SERVICE' : 'CALLED • ARRIVING'}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white mt-1">
                    {activeCustomer.customerName}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{activeCustomer.phone}</span>
                  </div>
                </div>

                {/* Selected Services breakdown */}
                <div className="bg-charcoal-900 rounded-2xl p-4 border border-charcoal-700/80 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Selected Services
                  </div>
                  <div className="font-bold text-gray-200">
                    {Array.isArray(activeCustomer.services)
                      ? activeCustomer.services.join(' • ')
                      : activeCustomer.services}
                  </div>
                  <div className="text-[11px] text-gold-400 font-semibold pt-1 flex justify-between">
                    <span>Est. Time: {activeCustomer.totalDuration || 30} mins</span>
                    <span>Total: {t('salon.currency')}{activeCustomer.totalPrice || 200}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400">
                <div className="w-12 h-12 mx-auto rounded-full bg-charcoal-900 flex items-center justify-center text-gray-500 mb-2 border border-charcoal-700">
                  <Scissors className="w-6 h-6 text-gray-500" />
                </div>
                <div className="text-sm font-bold text-gray-300">
                  Chair #{currentBarber.chair} is Available
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Call the next waiting customer using the button on the right.
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: START and DONE */}
          {activeCustomer && (
            <div className="mt-6 pt-4 border-t border-charcoal-700 space-y-2.5">
              {/* START BUTTON (Active when customer is called) */}
              {activeCustomer.status === 'called' ? (
                <button
                  type="button"
                  id="barber-start-service-btn"
                  onClick={() => startService(activeCustomer.id)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-charcoal-900 font-black text-sm tracking-wide transition shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Service (Customer in Chair)</span>
                </button>
              ) : (
                /* DONE BUTTON (Active when customer is in service) */
                <button
                  type="button"
                  id="barber-done-service-btn"
                  onClick={() => completeService(activeCustomer.id)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-charcoal-900 font-black text-sm tracking-wide transition shadow-lg shadow-gold-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Done (Complete Service & Free Chair)</span>
                </button>
              )}

              {/* No-Show action button */}
              <button
                type="button"
                id="barber-noshow-btn"
                onClick={() => markNoShow(activeCustomer.id)}
                className="w-full py-2 rounded-xl bg-charcoal-900 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-charcoal-700 hover:border-rose-500/30 transition flex items-center justify-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Customer Did Not Show (No-Show)</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* CARD 2: NEXT CUSTOMER FOR THAT BARBER                        */}
        {/* ============================================================ */}
        <div 
          id="barber-next-customer-card"
          className="bg-charcoal-800 rounded-3xl p-6 border border-charcoal-700 shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                <span>Next Customer for {currentBarber.name}</span>
              </span>
              <span className="text-xs text-gray-400 font-bold">
                Chair #{currentBarber.chair}
              </span>
            </div>

            {nextCustomer ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      #{nextCustomer.tokenNumber}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-charcoal-900 text-gold-400 border border-gold-500/30">
                      {nextCustomer.barberId === currentBarber.id ? `${currentBarber.name} Exclusive` : 'Any Stylist'}
                    </span>
                  </div>

                  <div className="text-xl font-bold text-gray-100 mt-1">
                    {nextCustomer.customerName}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Waited: ~{nextCustomer.elapsedMinutes || 15} mins in line
                  </div>
                </div>

                <div className="bg-charcoal-900 rounded-2xl p-4 border border-charcoal-700 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Requested Services
                  </div>
                  <div className="font-semibold text-gray-200">
                    {Array.isArray(nextCustomer.services) ? nextCustomer.services.join(', ') : nextCustomer.services}
                  </div>
                  <div className="text-[11px] text-gold-400 font-bold pt-1">
                    Est. Duration: {nextCustomer.totalDuration || 30} mins
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400">
                <div className="w-12 h-12 mx-auto rounded-full bg-charcoal-900 flex items-center justify-center text-gray-500 mb-2 border border-charcoal-700">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-sm font-bold text-gray-300">
                  No Eligible Waiting Customers
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Queue has no pending customers for {currentBarber.name} or "Any Stylist".
                </div>
              </div>
            )}
          </div>

          {/* Call Next Customer Action */}
          <div className="mt-6 pt-4 border-t border-charcoal-700 space-y-2">
            <button
              type="button"
              id="barber-call-next-btn"
              disabled={!!activeCustomer || currentBarber.status !== 'active' || !nextCustomer}
              onClick={handleCallNext}
              className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${
                !!activeCustomer || currentBarber.status !== 'active' || !nextCustomer
                  ? 'bg-charcoal-700 text-gray-500 cursor-not-allowed border border-charcoal-700'
                  : 'bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-charcoal-900 shadow-gold-500/20 active:scale-[0.98]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>
                {!!activeCustomer
                  ? 'Complete Current Customer First'
                  : currentBarber.status !== 'active'
                  ? 'Switch to Available to Call'
                  : !nextCustomer
                  ? 'No Waiting Customers'
                  : `Call #${nextCustomer.tokenNumber} to Chair #${currentBarber.chair}`}
              </span>
            </button>

            {currentBarber.status === 'break' && (
              <p className="text-[11px] text-amber-400 text-center font-medium">
                ⚠️ You are currently on break. Switch status to "Available" above to call customers.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
