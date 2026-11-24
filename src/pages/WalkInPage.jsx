import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { dummyServices, dummyBarbers } from '../data/dummyData';
import { UserPlus, ArrowLeft, Check, Sparkles } from 'lucide-react';

export default function WalkInPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState(['s-1']);
  const [assignedBarber, setAssignedBarber] = useState('any');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalCost = dummyServices
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const totalDuration = dummyServices
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.duration, 0);

  const handleGenerateWalkIn = (e) => {
    e.preventDefault();
    alert(`Dummy Walk-In Token #W-103 generated for ${customerName || 'Walk-In Customer'}!`);
    navigate('/receptionist');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Return button */}
      <Link
        to="/receptionist"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gold-400 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Receptionist Dashboard</span>
      </Link>

      <div className="bg-charcoal-800 rounded-3xl p-6 sm:p-8 border border-charcoal-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-charcoal-700">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Screen 3 Modal / Standalone View
            </div>
            <h1 className="text-xl font-black text-white">Generate Walk-In Token</h1>
          </div>
        </div>

        <form onSubmit={handleGenerateWalkIn} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Customer Name / ગ્રાહકનું નામ *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Bhai"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Phone Number (Optional for Walk-Ins)
            </label>
            <input
              type="tel"
              placeholder="Optional phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Select Services / સેવાઓ *
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {dummyServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                const displayName = language === 'gu' ? service.name_gu : service.name_en;
                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-gold-500/10 border-gold-500 text-white'
                        : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-charcoal-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-gold-500 border-gold-500 text-charcoal-900' : 'border-charcoal-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-semibold">{displayName}</span>
                    </div>
                    <span className="text-xs font-bold text-gold-400">
                      {t('salon.currency')}{service.price} ({service.duration}m)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Assign Barber / Chair
            </label>
            <select
              value={assignedBarber}
              onChange={(e) => setAssignedBarber(e.target.value)}
              className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
            >
              <option value="any">Any Available Stylist (Default)</option>
              {dummyBarbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Chair #{b.chair})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-charcoal-900 p-4 rounded-xl border border-charcoal-700 flex justify-between items-center text-xs">
            <span className="text-gray-400">Total: {totalDuration} mins</span>
            <span className="text-base font-bold text-gold-400">{t('salon.currency')}{totalCost}</span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-bold text-sm tracking-wide transition shadow-lg shadow-gold-500/20"
          >
            Generate Walk-In Token (W-XXX)
          </button>
        </form>
      </div>
    </div>
  );
}
