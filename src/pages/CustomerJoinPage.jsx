import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { dummyServices, dummyBarbers, dummySalonSettings, dummyQueueTokens } from '../data/dummyData';
import { generateNextTokenNumber, calculateDynamicWaitTime } from '../lib/queueRules';
import { 
  Scissors, 
  Check, 
  ArrowLeft, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  User, 
  Phone, 
  CheckCircle2, 
  X,
  Info
} from 'lucide-react';

export default function CustomerJoinPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [chosenBarber, setChosenBarber] = useState('any'); // 'any', 'barber-ravi', 'barber-amit', 'barber-imran'

  // Validation & Modal State
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [limitNotice, setLimitNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle service selection with MAX 3 CONSTRAINT
  const toggleService = (serviceId) => {
    setErrors((prev) => ({ ...prev, services: '' }));
    setLimitNotice(false);

    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      if (selectedServices.length >= 3) {
        setLimitNotice(true);
        setTimeout(() => setLimitNotice(false), 4000);
        return;
      }
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Compute selected items, total duration, and total price
  const selectedServiceObjects = dummyServices.filter((s) =>
    selectedServices.includes(s.id)
  );

  const totalDuration = selectedServiceObjects.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  const totalPrice = selectedServiceObjects.reduce(
    (sum, s) => sum + s.price,
    0
  );

  // Determine chosen barber object
  const selectedBarberObject = dummyBarbers.find((b) => b.id === chosenBarber);

  // Dynamic estimated wait time from queue rules
  const estimatedWait = calculateDynamicWaitTime({
    barberId: chosenBarber === 'any' ? null : chosenBarber,
    precedingCustomers: dummyQueueTokens,
    activeBarbersCount: 3,
    bufferMinutes: dummySalonSettings.bufferMinutes || 5
  });

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    // 1. Name validation (at least 2 non-whitespace characters)
    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.name = t('join.validation.nameRequired');
    }

    // 2. 10-digit phone number validation
    const cleanedPhone = customerPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone) && !/^\d{10}$/.test(cleanedPhone)) {
      newErrors.phone = t('join.validation.phoneRequired');
    }

    // 3. Services validation (1 to 3 services)
    if (selectedServices.length === 0) {
      newErrors.services = t('join.validation.serviceRequired');
    } else if (selectedServices.length > 3) {
      newErrors.services = t('join.validation.maxServices');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open Confirmation Modal
  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Final Confirmation: Generate Token (S-1, S-2, S-3...) & Save
  const handleFinalConfirm = () => {
    setIsSubmitting(true);

    // SPEC REQUIREMENT: Generate unique token such as S-1, S-2, S-3
    const tokenNumber = generateNextTokenNumber();

    const newToken = {
      id: `tok-${Date.now()}`,
      tokenNumber: tokenNumber, // e.g. S-1, S-2, S-3
      customerName: customerName.trim(),
      phone: customerPhone.replace(/\D/g, ''),
      services: selectedServiceObjects.map((s) =>
        language === 'gu' ? s.name_gu : s.name_en
      ),
      totalDuration,
      totalPrice,
      barberId: chosenBarber === 'any' ? null : chosenBarber,
      barberName: selectedBarberObject
        ? (language === 'gu' ? selectedBarberObject.nameGu : selectedBarberObject.name)
        : (language === 'gu' ? 'કોઈપણ ઉપલબ્ધ વાળંદ' : 'Any Available Stylist'),
      chair: selectedBarberObject ? selectedBarberObject.chair : 1,
      status: 'waiting',
      position: 2, // Default to second in line for immediate demo of "Start coming" rule, or based on queue
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedWaitMinutes: estimatedWait,
    };

    // Store in localStorage for persistence
    localStorage.setItem('salon_active_token', JSON.stringify(newToken));

    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(false);
      navigate('/status');
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Top Breadcrumb Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gold-400 transition mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
        <span>{t('join.btnCancel')}</span>
      </Link>

      {/* Screen Title & Queue Info */}
      <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 transform -rotate-45" />
            <span>Screen 2 • Join Queue</span>
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {dummySalonSettings.isQueueOpen ? t('salon.open') : t('salon.closed')}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">{t('join.title')}</h1>
        <p className="text-xs text-gray-400 mt-1">{t('join.subtitle')}</p>
      </div>

      {/* Main Join Queue Form */}
      <form onSubmit={handleProceedToReview} noValidate className="space-y-5">
        {/* Customer Information Card */}
        <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>1. Customer Details</span>
          </h2>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {t('join.fullName')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="customer-name-input"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder={t('join.fullNamePlaceholder')}
              className={`w-full bg-charcoal-900 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition ${
                errors.name
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-charcoal-600 focus:border-gold-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1" id="name-error-msg">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* 10-Digit Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {t('join.phone')} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-gray-400 select-none">
                +91
              </span>
              <input
                type="tel"
                id="customer-phone-input"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setCustomerPhone(val);
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                placeholder={t('join.phonePlaceholder')}
                className={`w-full bg-charcoal-900 border rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none tracking-wide transition ${
                  errors.phone
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-charcoal-600 focus:border-gold-500'
                }`}
              />
            </div>
            {errors.phone ? (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1" id="phone-error-msg">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.phone}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500">
                10 numeric digits required for live token status.
              </p>
            )}
          </div>
        </div>

        {/* Services Selection Matrix (Max 3 Allowed) */}
        <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 transform -rotate-45" />
              <span>2. {t('join.selectServices')}</span>
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                selectedServices.length === 3
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-charcoal-700 text-gray-300 border-charcoal-600'
              }`}
            >
              {selectedServices.length} / 3 Selected
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-snug">
            {t('join.servicesLimit')}
          </p>

          {/* Max 3 Limit Warning Alert */}
          {limitNotice && (
            <div
              className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-bounce"
              id="limit-alert-banner"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{t('join.maxServicesAlert')}</span>
            </div>
          )}

          {errors.services && (
            <p className="text-xs text-rose-400 flex items-center gap-1" id="services-error-msg">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.services}</span>
            </p>
          )}

          {/* Service Cards */}
          <div className="space-y-2 pt-1">
            {dummyServices.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              const displayName = language === 'gu' ? service.name_gu : service.name_en;
              const displayDesc = language === 'gu' ? service.description_gu : service.description_en;

              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold-500/15 via-gold-500/10 to-charcoal-900 border-gold-500 shadow-md shadow-gold-500/5'
                      : 'bg-charcoal-900/90 border-charcoal-700 text-gray-300 hover:border-charcoal-600'
                  }`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleService(service.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-gold-500 border-gold-500 text-charcoal-900'
                            : 'border-charcoal-600 bg-charcoal-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                          {displayDesc}
                        </div>
                        <div className="text-[11px] text-gold-400/90 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{service.duration} {t('salon.mins')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-gold-400">
                        {t('salon.currency')}{service.price}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barber Choice: Ravi, Amit, Imran, or Any Stylist */}
        <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>3. {t('join.chooseBarber')}</span>
          </h2>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {/* Any Available Option (Recommended) */}
            <div
              onClick={() => setChosenBarber('any')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition select-none flex items-center justify-between ${
                chosenBarber === 'any'
                  ? 'bg-gradient-to-r from-gold-500/20 via-gold-500/10 to-charcoal-900 border-gold-500 shadow-md'
                  : 'bg-charcoal-900/90 border-charcoal-700 hover:border-charcoal-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    chosenBarber === 'any'
                      ? 'border-gold-500 bg-gold-500 text-charcoal-900'
                      : 'border-charcoal-600 bg-charcoal-800'
                  }`}
                >
                  {chosenBarber === 'any' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {t('join.anyBarber')}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    ⚡ Recommended for shortest wait time
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Fastest
              </span>
            </div>

            {/* The 3 Sample Barbers: Ravi, Amit, Imran */}
            {dummyBarbers.map((barber) => {
              const isSelected = chosenBarber === barber.id;
              const displayName = language === 'gu' ? barber.nameGu : barber.name;
              const displaySpec = language === 'gu' ? barber.specialtyGu : barber.specialty;

              return (
                <div
                  key={barber.id}
                  onClick={() => setChosenBarber(barber.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition select-none flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold-500/20 via-gold-500/10 to-charcoal-900 border-gold-500 shadow-md'
                      : 'bg-charcoal-900/90 border-charcoal-700 hover:border-charcoal-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500 text-charcoal-900'
                          : 'border-charcoal-600 bg-charcoal-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{displayName}</span>
                        <span className="text-[11px] font-semibold text-gold-400">
                          (Chair #{barber.chair})
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {displaySpec}
                      </div>
                    </div>
                  </div>
                  <span className="text-base">{barber.avatar}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Selection Summary Card (Duration & Price) */}
        <div className="bg-charcoal-800 rounded-3xl p-5 border border-charcoal-700 shadow-xl space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
            {t('join.summaryTitle')}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-300">
            <span>{t('join.servicesCount')}:</span>
            <span className="font-bold text-white">
              {selectedServices.length} of 3
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-300">
            <span>{t('join.estTime')}:</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              <span>{totalDuration} {t('salon.mins')}</span>
            </span>
          </div>

          <div className="pt-2 border-t border-charcoal-700/80 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-200">{t('join.estPrice')}:</span>
            <span className="text-xl font-black text-gold-400">
              {t('salon.currency')}{totalPrice}
            </span>
          </div>
        </div>

        {/* Proceed CTA */}
        <button
          type="submit"
          id="proceed-review-btn"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 hover:from-gold-400 hover:to-gold-300 text-charcoal-900 font-black text-sm tracking-wide transition shadow-xl shadow-gold-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>{t('join.btnJoin')}</span>
        </button>
      </form>

      {/* CONFIRMATION SUMMARY MODAL */}
      {showConfirmation && (
        <div
          id="confirmation-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-charcoal-800 w-full max-w-sm rounded-3xl p-6 border-2 border-gold-500 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-charcoal-700 text-gray-400 hover:text-white transition"
              aria-label="Close review"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/40 mb-2 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">
                {t('join.confirmationTitle')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('join.confirmationDesc')}
              </p>
            </div>

            {/* Confirmation Items */}
            <div className="bg-charcoal-900 rounded-2xl p-4 border border-charcoal-700/80 space-y-3 text-xs mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('join.confirmCustomer')}
                </span>
                <div className="font-bold text-white text-sm mt-0.5">{customerName}</div>
                <div className="text-gray-400 font-mono">+91 {customerPhone}</div>
              </div>

              <div className="pt-2 border-t border-charcoal-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('join.confirmServices')} ({selectedServices.length})
                </span>
                <ul className="mt-1 space-y-1">
                  {selectedServiceObjects.map((s) => (
                    <li key={s.id} className="flex justify-between text-gray-300">
                      <span>• {language === 'gu' ? s.name_gu : s.name_en}</span>
                      <span className="font-bold text-gold-400">{t('salon.currency')}{s.price}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-charcoal-700/60 flex justify-between">
                <span className="text-gray-400">{t('join.confirmBarber')}:</span>
                <span className="font-bold text-white">
                  {selectedBarberObject
                    ? `${language === 'gu' ? selectedBarberObject.nameGu : selectedBarberObject.name} (Chair #${selectedBarberObject.chair})`
                    : (language === 'gu' ? 'કોઈપણ ઉપલબ્ધ વાળંદ' : 'Any Stylist (Fastest)')}
                </span>
              </div>

              <div className="pt-2 border-t border-charcoal-700/60 flex justify-between">
                <span className="text-gray-400">{t('join.confirmEstWait')}:</span>
                <span className="font-bold text-amber-400">
                  ~{estimatedWait} {t('salon.mins')}
                </span>
              </div>

              <div className="pt-2 border-t border-charcoal-700/60 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-200">Total Payable at Counter:</span>
                <span className="text-gold-400 text-base">{t('salon.currency')}{totalPrice}</span>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                id="final-confirm-token-btn"
                disabled={isSubmitting}
                onClick={handleFinalConfirm}
                className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-black text-sm tracking-wide transition shadow-lg shadow-gold-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? 'Generating Token (S-...)...' : t('join.btnConfirm')}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="w-full py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 font-semibold text-xs transition"
              >
                {t('join.btnEdit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
