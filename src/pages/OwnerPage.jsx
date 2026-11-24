import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useQueue } from '../contexts/QueueContext';
import { 
  Settings, 
  Scissors, 
  Users, 
  BarChart3, 
  Plus, 
  Check, 
  Clock, 
  UserX, 
  UserCheck, 
  AlertCircle, 
  Edit2, 
  RefreshCw, 
  ExternalLink, 
  Info, 
  CheckCircle2, 
  X,
  Sliders,
  DollarSign,
  Power
} from 'lucide-react';

export default function OwnerPage() {
  const { t, language } = useLanguage();
  const { 
    services, 
    barbers, 
    isQueueOpen, 
    toggleQueueOpen, 
    toggleServiceActive, 
    updateService, 
    addService, 
    toggleBarberDuty, 
    setBarberStatus, 
    resetToDefaults,
    customersServedToday, 
    noShowsToday, 
    avgWaitTimeToday,
    queue,
    getActiveCustomerForBarber
  } = useQueue();

  const [activeTab, setActiveTab] = useState('services');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // New Service Form State
  const [newServiceNameEn, setNewServiceNameEn] = useState('');
  const [newServiceNameGu, setNewServiceNameGu] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(250);
  const [newServiceCategory, setNewServiceCategory] = useState('Hair');

  // Edit Service Form State
  const [editPrice, setEditPrice] = useState(0);
  const [editDuration, setEditDuration] = useState(30);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameGu, setEditNameGu] = useState('');

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setEditPrice(service.price);
    setEditDuration(service.duration);
    setEditNameEn(service.name_en);
    setEditNameGu(service.name_gu);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingService) return;

    updateService(editingService.id, {
      name_en: editNameEn.trim() || editingService.name_en,
      name_gu: editNameGu.trim() || editingService.name_gu,
      price: parseInt(editPrice, 10) || editingService.price,
      duration: parseInt(editDuration, 10) || editingService.duration,
    });

    triggerToast(`Updated "${editNameEn || editingService.name_en}" successfully.`);
    setEditingService(null);
  };

  const handleAddServiceSubmit = (e) => {
    e.preventDefault();
    if (!newServiceNameEn.trim()) return;

    const added = addService({
      name_en: newServiceNameEn.trim(),
      name_gu: newServiceNameGu.trim() || newServiceNameEn.trim(),
      duration: parseInt(newServiceDuration, 10) || 30,
      price: parseInt(newServicePrice, 10) || 200,
      category: newServiceCategory,
    });

    triggerToast(`Service "${added.name_en}" added to catalog.`);
    setNewServiceNameEn('');
    setNewServiceNameGu('');
    setNewServiceDuration(30);
    setNewServicePrice(250);
    setShowAddModal(false);
  };

  const handleResetData = () => {
    resetToDefaults();
    setShowResetConfirm(false);
    triggerToast('All salon data has been reset to factory defaults.');
  };

  // Active in line count
  const waitingInLineCount = queue.filter(t => t.status === 'waiting').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-gold-500 text-charcoal-900 font-bold px-4 py-3 rounded-xl shadow-2xl border border-gold-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-charcoal-900" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-charcoal-700">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gold-400 uppercase tracking-widest">
            <Settings className="w-4 h-4" />
            <span>{t('owner.screenTitle')}</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            {t('owner.heading')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('owner.subheading')}
          </p>
        </div>

        {/* Quick Link to Test Screens */}
        <div className="flex items-center gap-3">
          <Link
            to="/join"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gold-400 text-xs font-bold border border-charcoal-700 transition"
            title="Open Screen 2 to verify online join and service visibility"
          >
            <span>{t('nav.customerJoin')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/receptionist"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 text-xs font-bold border border-charcoal-700 transition"
          >
            <span>{t('nav.receptionist')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 1. Master Online Queue Switch Card */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 shadow-xl ${
        isQueueOpen 
          ? 'bg-gradient-to-r from-charcoal-800 via-charcoal-800 to-emerald-950/30 border-emerald-500/40' 
          : 'bg-gradient-to-r from-charcoal-800 via-charcoal-800 to-rose-950/30 border-rose-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${isQueueOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <h2 className="text-lg font-bold text-white">
                {isQueueOpen ? t('owner.queueControl.openStatus') : t('owner.queueControl.closedStatus')}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isQueueOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isQueueOpen ? t('salon.open') : t('salon.closed')}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {t('owner.queueControl.desc')}
            </p>
            <div className="flex items-center gap-2 text-xs text-gold-300/80 pt-1">
              <Info className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>{t('owner.queueControl.walkInNote')}</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => {
                toggleQueueOpen();
                triggerToast(isQueueOpen ? 'Online queue closed. Walk-ins still accepted.' : 'Online queue opened for customers.');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 ${
                isQueueOpen
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-charcoal-900 shadow-emerald-900/30'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isQueueOpen ? t('owner.queueControl.toggleClose') : t('owner.queueControl.toggleOpen')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's Performance & Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Customers Served */}
        <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700/80 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>{t('owner.analytics.servedTitle')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{customersServedToday}</div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-block">
            ✓ Live count for today
          </span>
        </div>

        {/* Metric 2: Average Wait Time */}
        <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700/80 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>{t('owner.analytics.avgWaitTitle')}</span>
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gold-400">
            {avgWaitTimeToday} <span className="text-sm font-bold text-gray-400">{t('salon.mins')}</span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium mt-1 inline-block">
            Target threshold &lt; 30 mins
          </span>
        </div>

        {/* Metric 3: Today's No-Shows */}
        <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700/80 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>{t('owner.analytics.noShowsTitle')}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400">{noShowsToday}</div>
          <span className="text-[11px] text-gray-400 font-medium mt-1 inline-block">
            Flagged at reception
          </span>
        </div>

        {/* Metric 4: Currently in Queue */}
        <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700/80 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-2">
            <span>{t('owner.analytics.liveQueue')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{waitingInLineCount}</div>
          <span className="text-[11px] text-gray-400 font-medium mt-1 inline-block">
            Waiting in queue
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-charcoal-700 pb-3 overflow-x-auto">
        {[
          { id: 'services', label: t('owner.tabs.services'), icon: Scissors, badge: services.length },
          { id: 'barbers', label: t('owner.tabs.barbers'), icon: Users, badge: barbers.filter(b => b.status === 'active').length },
          { id: 'controls', label: t('owner.tabs.controls'), icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-gold-500 text-charcoal-900 shadow-md shadow-gold-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-charcoal-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-charcoal-900 text-gold-400' : 'bg-charcoal-700 text-gray-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SERVICE MANAGEMENT & PRICING */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{t('owner.serviceTable.title')}</h2>
              <p className="text-xs text-gray-400">
                Turn services ON or OFF to control what customers can choose on the Join Queue screen.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 text-xs font-black transition shadow-lg shadow-gold-500/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('owner.tabs.addService')}</span>
            </button>
          </div>

          {/* Services Table */}
          <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-900/90 border-b border-charcoal-700 text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{t('owner.serviceTable.name')}</th>
                    <th className="py-3.5 px-4">{t('owner.serviceTable.duration')}</th>
                    <th className="py-3.5 px-4">{t('owner.serviceTable.price')}</th>
                    <th className="py-3.5 px-4 text-center">{t('owner.serviceTable.status')}</th>
                    <th className="py-3.5 px-4 text-right">{t('owner.serviceTable.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-700/60">
                  {services.map((service) => {
                    const isServiceActive = service.isActive !== false;
                    return (
                      <tr 
                        key={service.id} 
                        className={`transition ${isServiceActive ? 'hover:bg-charcoal-700/30' : 'bg-charcoal-900/40 opacity-70'}`}
                      >
                        {/* Service Names */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">
                            {service.name_en}
                          </div>
                          <div className="text-gold-400 font-medium text-xs mt-0.5">
                            {service.name_gu}
                          </div>
                          {service.category && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-charcoal-700 text-gray-300">
                              {service.category}
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 text-gray-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {service.duration} {t('salon.mins')}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {t('salon.currency')}{service.price}
                        </td>

                        {/* Active / Inactive Status Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              toggleServiceActive(service.id);
                              triggerToast(
                                isServiceActive
                                  ? `Disabled "${service.name_en}". It is now hidden from Join Queue.`
                                  : `Enabled "${service.name_en}". It is now visible on Join Queue.`
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black transition ${
                              isServiceActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                            title="Click to toggle active status"
                          >
                            <span className={`w-2 h-2 rounded-full ${isServiceActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <span>{isServiceActive ? t('owner.serviceTable.active') : t('owner.serviceTable.inactive')}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(service)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-gold-400 font-bold text-xs transition"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{t('owner.serviceTable.edit')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BARBER ON-DUTY ROSTER */}
      {activeTab === 'barbers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">{t('owner.barbers.title')}</h2>
              <p className="text-xs text-gray-400">
                Manage which barbers are on duty. Barbers set to Off Duty will not receive new customer calls.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {barbers.map((barber) => {
              const activeCustomer = getActiveCustomerForBarber(barber.id);
              const isOnDuty = barber.status === 'active';
              const isOnBreak = barber.status === 'break';
              const isOffDuty = barber.status === 'off_duty';

              return (
                <div 
                  key={barber.id} 
                  className={`bg-charcoal-800 rounded-2xl border p-5 space-y-4 shadow-xl transition-all ${
                    isOnDuty 
                      ? 'border-gold-500/40 hover:border-gold-500' 
                      : isOnBreak 
                        ? 'border-amber-500/40 opacity-90' 
                        : 'border-charcoal-700 opacity-60'
                  }`}
                >
                  {/* Top Barber Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20">
                      {t('owner.barbers.chair')} #{barber.chair}
                    </span>
                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isOnDuty
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isOnBreak
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isOnDuty ? t('owner.barbers.onDuty') : isOnBreak ? t('owner.barbers.onBreak') : t('owner.barbers.offDuty')}
                    </span>
                  </div>

                  {/* Name & Active Customer */}
                  <div>
                    <h3 className="text-xl font-black text-white">{barber.name}</h3>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <span className="text-gray-400">{t('owner.barbers.activeCustomer')}:</span>
                      {activeCustomer ? (
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {activeCustomer.customerName} ({activeCustomer.tokenNumber})
                        </span>
                      ) : (
                        <span className="italic text-gray-400">{t('owner.barbers.none')}</span>
                      )}
                    </div>
                  </div>

                  {/* Duty Toggle Button & Status Selector */}
                  <div className="pt-2 border-t border-charcoal-700/80 space-y-2">
                    <div className="text-[11px] font-bold text-gray-400">
                      {t('owner.barbers.status')}:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => {
                          setBarberStatus(barber.id, 'active');
                          triggerToast(`${barber.name} is now On Duty`);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition ${
                          isOnDuty 
                            ? 'bg-emerald-500 text-charcoal-900 shadow-md font-black' 
                            : 'bg-charcoal-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t('owner.barbers.onDuty')}
                      </button>
                      <button
                        onClick={() => {
                          setBarberStatus(barber.id, 'break');
                          triggerToast(`${barber.name} is now On Break`);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition ${
                          isOnBreak 
                            ? 'bg-amber-500 text-charcoal-900 shadow-md font-black' 
                            : 'bg-charcoal-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t('owner.barbers.onBreak')}
                      </button>
                      <button
                        onClick={() => {
                          setBarberStatus(barber.id, 'off_duty');
                          triggerToast(`${barber.name} is now Off Duty`);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition ${
                          isOffDuty 
                            ? 'bg-rose-500 text-white shadow-md font-black' 
                            : 'bg-charcoal-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t('owner.barbers.offDuty')}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        toggleBarberDuty(barber.id);
                        triggerToast(`${barber.name} duty toggled`);
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-bold bg-charcoal-700 hover:bg-charcoal-600 text-gold-300 transition"
                    >
                      {isOffDuty ? '⚡ Set to On Duty' : 'Set to Off Duty'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: QUEUE RULES & RESET */}
      {activeTab === 'controls' && (
        <div className="space-y-6 max-w-3xl">
          {/* Rules Summary */}
          <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold-400" />
              <span>Salon Operating Rules & Limits</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-charcoal-900/60 p-4 rounded-xl border border-charcoal-700">
                <span className="text-gray-400 block mb-1">Buffer Time Between Services</span>
                <span className="text-xl font-bold text-white">5 Minutes</span>
                <span className="text-gray-400 block mt-1">Calculated in wait-time formula</span>
              </div>
              <div className="bg-charcoal-900/60 p-4 rounded-xl border border-charcoal-700">
                <span className="text-gray-400 block mb-1">Max Queue Capacity</span>
                <span className="text-xl font-bold text-white">25 Waiting Tokens</span>
                <span className="text-gray-400 block mt-1">Prevents over-booking</span>
              </div>
            </div>
          </div>

          {/* Reset All Data Section */}
          <div className="bg-charcoal-800 rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-white">{t('owner.reset.title')}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {t('owner.reset.desc')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('owner.reset.button')}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW SERVICE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-gold-400" />
                <span>{t('owner.serviceModal.addTitle')}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {t('owner.serviceModal.nameEn')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Beard Spa"
                  value={newServiceNameEn}
                  onChange={(e) => setNewServiceNameEn(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {t('owner.serviceModal.nameGu')} (ગુજરાતી)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. રોયલ બિયર્ડ સ્પા"
                  value={newServiceNameGu}
                  onChange={(e) => setNewServiceNameGu(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {t('owner.serviceModal.duration')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {t('owner.serviceModal.price')}
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {t('owner.serviceModal.category')}
                </label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="Hair">Hair</option>
                  <option value="Beard">Beard</option>
                  <option value="Spa">Spa & Treatment</option>
                  <option value="Facial">Facial</option>
                  <option value="Color">Coloring</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white font-bold transition"
                >
                  {t('owner.serviceModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-black shadow-lg shadow-gold-500/10 transition"
                >
                  {t('owner.serviceModal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SERVICE */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-gold-400" />
                <span>{t('owner.serviceModal.editTitle')}</span>
              </h3>
              <button
                onClick={() => setEditingService(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {t('owner.serviceModal.nameEn')}
                </label>
                <input
                  type="text"
                  required
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {t('owner.serviceModal.nameGu')} (ગુજરાતી)
                </label>
                <input
                  type="text"
                  value={editNameGu}
                  onChange={(e) => setEditNameGu(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {t('owner.serviceModal.duration')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {t('owner.serviceModal.price')}
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-700">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white font-bold transition"
                >
                  {t('owner.serviceModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-black shadow-lg shadow-gold-500/10 transition"
                >
                  {t('owner.serviceModal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: RESET DATA */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-charcoal-800 rounded-2xl border border-rose-500/40 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Factory Reset</h3>
            </div>
            <p className="text-xs text-gray-300">
              {t('owner.reset.confirm')}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-700">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-900/30"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
