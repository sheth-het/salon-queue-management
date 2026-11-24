import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQueue } from '../contexts/QueueContext';
import StatusBadge from '../components/common/StatusBadge';
import { dummyServices } from '../data/dummyData';
import { isBarberBusy, getActiveCustomerForBarber } from '../lib/queueRules';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Clock, 
  Search, 
  Bell, 
  CheckCircle2, 
  UserX, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Scissors,
  Check,
  X,
  PlayCircle
} from 'lucide-react';

export default function ReceptionistPage() {
  const { t, language } = useLanguage();
  const { 
    queue, 
    barbers, 
    services,
    callNextCustomer, 
    startService, 
    completeService, 
    markNoShow, 
    cancelToken, 
    addWalkIn,
    reassignCustomerBarber 
  } = useQueue();

  const [activeFilter, setActiveFilter] = useState('waiting');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState(['srv-1']);
  const [walkInBarber, setWalkInBarber] = useState('any');
  const [walkInError, setWalkInError] = useState('');

  const showFeedback = (msg, type = 'info') => {
    setFeedbackNotice({ msg, type });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Call next eligible customer using shared context action
  const handleCallNextForBarber = (barber) => {
    const res = callNextCustomer(barber.id);
    if (res.success) {
      showFeedback(
        `Called token #${res.tokenNumber} (${res.customer.customerName}) to Chair #${barber.chair} (${barber.name})!`,
        'success'
      );
    } else {
      showFeedback(res.reason, 'warning');
    }
  };

  const handleCreateWalkIn = (e) => {
    e.preventDefault();
    if (!walkInName.trim()) {
      setWalkInError('Customer name is required.');
      return;
    }
    if (walkInServices.length === 0) {
      setWalkInError('Select at least 1 service.');
      return;
    }

    const activeServiceList = services || dummyServices;
    const selectedObjs = activeServiceList.filter(s => walkInServices.includes(s.id));
    const newWalkIn = addWalkIn({
      customerName: walkInName.trim(),
      phone: walkInPhone.replace(/\D/g, ''),
      services: selectedObjs.map(s => language === 'gu' ? s.name_gu : s.name_en),
      barberId: walkInBarber
    });

    setShowWalkInModal(false);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInServices(['srv-1']);
    setWalkInBarber('any');
    showFeedback(`Generated Walk-In Token #${newWalkIn.tokenNumber} for ${newWalkIn.customerName}!`, 'success');
  };

  const toggleWalkInService = (id) => {
    if (walkInServices.includes(id)) {
      setWalkInServices(walkInServices.filter(s => s !== id));
    } else {
      if (walkInServices.length >= 3) {
        setWalkInError('Maximum 3 services can be selected for walk-in.');
        setTimeout(() => setWalkInError(''), 3000);
        return;
      }
      setWalkInServices([...walkInServices, id]);
    }
  };

  const filteredQueue = queue.filter(item => {
    if (activeFilter === 'waiting' && item.status !== 'waiting') return false;
    if (activeFilter === 'active' && item.status !== 'called' && item.status !== 'in_service') return false;
    if (activeFilter === 'history' && item.status !== 'completed' && item.status !== 'no_show' && item.status !== 'cancelled') return false;

    if (searchTerm) {
      const matchName = item.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchToken = item.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchToken;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Walk-In Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gold-400 uppercase tracking-widest">
            <Users className="w-4 h-4" />
            <span>{t('reception.screenTitle')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {t('reception.heading')}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('reception.subheading')}
          </p>
        </div>

        <button
          type="button"
          id="add-walkin-btn"
          onClick={() => setShowWalkInModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-charcoal-900 font-extrabold text-xs tracking-wide transition-all shadow-lg shadow-gold-500/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('reception.addWalkIn')}</span>
        </button>
      </div>

      {/* Floating Feedback Notification */}
      {feedbackNotice && (
        <div
          id="receptionist-feedback-banner"
          className={`mb-6 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150 ${
            feedbackNotice.type === 'error'
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : feedbackNotice.type === 'warning'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{feedbackNotice.msg}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 1: BARBER CARDS WITH CURRENT CUSTOMER & AVAILABILITY        */}
      {/* =================================================================== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400 flex items-center gap-2">
            <Scissors className="w-4 h-4 transform -rotate-45" />
            <span>{t('reception.barbersHeading')}</span>
          </h2>
          <span className="text-xs text-gray-400">
            3 Active Chairs • 1 Customer Per Barber Limit Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {barbers.map((barber) => {
            const activeCustomer = getActiveCustomerForBarber(barber.id, queue);
            const isBusy = !!activeCustomer;

            return (
              <div
                key={barber.id}
                id={`barber-card-${barber.name.toLowerCase()}`}
                className={`bg-charcoal-800 rounded-3xl p-5 border transition-all duration-200 shadow-xl flex flex-col justify-between ${
                  isBusy
                    ? 'border-gold-500/50 shadow-gold-500/5'
                    : 'border-charcoal-700 hover:border-charcoal-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{barber.avatar}</span>
                      <div>
                        <div className="text-base font-black text-white">
                          {language === 'gu' ? barber.nameGu : barber.name}
                        </div>
                        <div className="text-[11px] font-bold text-gold-400">
                          Chair #{barber.chair}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        barber.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {barber.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 mb-4">
                    {language === 'gu' ? barber.specialtyGu : barber.specialty}
                  </p>

                  {/* Current Customer / Availability Status */}
                  <div className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-700/80 mb-4">
                    {isBusy ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {activeCustomer.status === 'in_service' ? 'IN SERVICE' : 'CALLED TO CHAIR'}
                          </span>
                          <span className="text-xs font-black text-gold-400">
                            #{activeCustomer.tokenNumber}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {activeCustomer.customerName}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {Array.isArray(activeCustomer.services) ? activeCustomer.services.join(', ') : activeCustomer.services}
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-charcoal-700 flex items-center justify-between text-xs">
                          {activeCustomer.status === 'called' ? (
                            <button
                              onClick={() => startService(activeCustomer.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-charcoal-900 font-bold transition"
                            >
                              Start Service
                            </button>
                          ) : (
                            <button
                              onClick={() => completeService(activeCustomer.id)}
                              className="px-2.5 py-1 rounded-lg bg-gold-500/20 text-gold-300 hover:bg-gold-500 hover:text-charcoal-900 font-bold transition"
                            >
                              Complete Service
                            </button>
                          )}
                          <button
                            onClick={() => markNoShow(activeCustomer.id)}
                            className="text-rose-400 hover:underline text-[11px]"
                          >
                            No-Show
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <span className="text-xs font-bold text-gray-400 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>{t('reception.vacant')}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Call Next Customer Button */}
                <div>
                  <button
                    type="button"
                    id={`call-next-btn-${barber.name.toLowerCase()}`}
                    disabled={isBusy || barber.status !== 'active'}
                    onClick={() => handleCallNextForBarber(barber)}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      isBusy || barber.status !== 'active'
                        ? 'bg-charcoal-700/60 text-gray-500 border border-charcoal-700 cursor-not-allowed'
                        : 'bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow-lg shadow-gold-500/10 active:scale-95'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>
                      {isBusy
                        ? t('reception.busyServing')
                        : barber.status !== 'active'
                        ? 'Barber On Break'
                        : `${t('reception.callNextEligible')} (${barber.name})`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 2: LIVE WAITING QUEUE IN FCFS ORDER                        */}
      {/* =================================================================== */}
      <div className="bg-charcoal-800 rounded-3xl p-5 sm:p-6 border border-charcoal-700 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-4 border-b border-charcoal-700">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>{t('reception.queueHeading')}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Arranged in strict first-come, first-served sequence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-xl border border-charcoal-700">
              {[
                { id: 'waiting', label: t('reception.filterWaiting') },
                { id: 'active', label: t('reception.filterServing') },
                { id: 'history', label: t('reception.filterFinished') },
                { id: 'all', label: t('reception.filterAll') },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeFilter === tab.id
                      ? 'bg-gold-500 text-charcoal-900'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Token/Name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-charcoal-900/80 border-b border-charcoal-700 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4"># / Token</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Services</th>
                <th className="py-3 px-4">Stylist Preference</th>
                <th className="py-3 px-4">Wait Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Queue Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700/60">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">
                    No customers found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item, index) => {
                  const hasWaitedOver60Mins = (item.elapsedMinutes || 0) > 60 && item.status === 'waiting';

                  return (
                    <tr
                      key={item.id}
                      id={`queue-row-${item.tokenNumber.toLowerCase()}`}
                      className={`transition-colors ${
                        hasWaitedOver60Mins
                          ? 'bg-rose-500/10 hover:bg-rose-500/15 border-l-4 border-rose-500'
                          : 'hover:bg-charcoal-700/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-charcoal-700 text-gray-400 text-[10px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-black text-sm text-gold-400 block leading-tight">
                              #{item.tokenNumber}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-gray-500">
                              {item.source}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{item.customerName}</div>
                        <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-300">
                        <div className="font-medium max-w-xs truncate">
                          {Array.isArray(item.services) ? item.services.join(', ') : item.services}
                        </div>
                        <div className="text-[11px] text-gold-400 font-bold mt-0.5">
                          {item.totalDuration || 30} mins • {t('salon.currency')}{item.totalPrice || 200}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.status === 'waiting' ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={item.barberId || 'any'}
                              onChange={(e) => {
                                const newBarberId = e.target.value;
                                if (reassignCustomerBarber) {
                                  reassignCustomerBarber(item.id, newBarberId);
                                  const targetBarber = barbers.find(b => b.id === newBarberId);
                                  showFeedback(
                                    `Reassigned Token #${item.tokenNumber} to ${targetBarber ? targetBarber.name : 'Any Stylist'}!`,
                                    'info'
                                  );
                                }
                              }}
                              className="bg-charcoal-900 border border-charcoal-600 rounded-lg px-2 py-1 text-[11px] font-bold text-gold-300 focus:outline-none focus:border-gold-500 cursor-pointer"
                              title="Reassign customer to another barber chair"
                            >
                              <option value="any">Any Available Stylist</option>
                              {barbers.map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.name} (Chair #{b.chair})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : item.barberId && item.barberId !== 'any' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-charcoal-900 border border-gold-500/30 text-gold-300 font-bold text-[11px]">
                            <Scissors className="w-3 h-3 text-gold-400" />
                            <span>{item.barberName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-charcoal-900 border border-charcoal-600 text-gray-300 font-medium text-[11px]">
                            <span>Any Stylist</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-200">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{item.elapsedMinutes || 15} mins</span>
                        </div>
                        {hasWaitedOver60Mins && (
                          <span 
                            id={`high-wait-badge-${item.tokenNumber.toLowerCase()}`}
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>{t('reception.highWaitAlert')}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'called' && (
                            <button
                              title="Start Service"
                              onClick={() => startService(item.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-charcoal-900 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition"
                            >
                              Start
                            </button>
                          )}
                          {item.status === 'in_service' && (
                            <button
                              title="Complete Service"
                              onClick={() => completeService(item.id)}
                              className="px-2 py-1 rounded-lg bg-gold-500/20 hover:bg-gold-500 hover:text-charcoal-900 text-gold-300 border border-gold-500/30 font-bold text-[11px] transition"
                            >
                              Done
                            </button>
                          )}

                          {item.status !== 'completed' && item.status !== 'no_show' && item.status !== 'cancelled' && (
                            <button
                              id={`no-show-btn-${item.tokenNumber.toLowerCase()}`}
                              title={t('reception.actions.noShow')}
                              onClick={() => markNoShow(item.id)}
                              className="p-1.5 rounded-lg bg-charcoal-900 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-charcoal-700 hover:border-rose-500/30 transition"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {item.status !== 'completed' && item.status !== 'no_show' && item.status !== 'cancelled' && (
                            <button
                              id={`cancel-btn-${item.tokenNumber.toLowerCase()}`}
                              title={t('reception.actions.cancel')}
                              onClick={() => cancelToken(item.id)}
                              className="p-1.5 rounded-lg bg-charcoal-900 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-charcoal-700 hover:border-rose-500/30 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-In Modal */}
      {showWalkInModal && (
        <div
          id="walkin-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-charcoal-800 w-full max-w-md rounded-3xl p-6 border-2 border-gold-500 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowWalkInModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-charcoal-700 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-charcoal-700">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {t('reception.walkInModal.title')}
                </h3>
                <p className="text-xs text-gray-400">
                  {t('reception.walkInModal.desc')}
                </p>
              </div>
            </div>

            {walkInError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t('reception.walkInModal.name')} *
                </label>
                <input
                  type="text"
                  id="walkin-name-input"
                  required
                  placeholder="e.g. Vikram Dave"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t('reception.walkInModal.phone')}
                </label>
                <input
                  type="tel"
                  id="walkin-phone-input"
                  placeholder="Optional phone number"
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('reception.walkInModal.services')}
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(services && services.length > 0 ? services.filter(s => s.isActive !== false) : dummyServices).map(srv => {
                    const isSel = walkInServices.includes(srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleWalkInService(srv.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSel
                            ? 'bg-gold-500/15 border-gold-500 text-white'
                            : 'bg-charcoal-900 border-charcoal-700 text-gray-400 hover:border-charcoal-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSel ? 'bg-gold-500 border-gold-500 text-charcoal-900' : 'border-charcoal-600'
                          }`}>
                            {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{language === 'gu' ? srv.name_gu : srv.name_en}</span>
                        </div>
                        <span className="font-bold text-gold-400">
                          {t('salon.currency')}{srv.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t('reception.walkInModal.barber')}
                </label>
                <select
                  value={walkInBarber}
                  onChange={e => setWalkInBarber(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="any">Any Available Stylist (Fastest)</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Chair #{b.chair})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  id="submit-walkin-btn"
                  className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs tracking-wide transition shadow-lg shadow-gold-500/20"
                >
                  {t('reception.walkInModal.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-3 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 font-semibold text-xs transition"
                >
                  {t('reception.walkInModal.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
