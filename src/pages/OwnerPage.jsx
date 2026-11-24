import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dummyServices, dummyBarbers, dummySalonSettings } from '../data/dummyData';
import { Settings, Scissors, Users, BarChart3, Plus, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export default function OwnerPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('services');
  const [isQueueOpen, setIsQueueOpen] = useState(dummySalonSettings.isQueueOpen);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Owner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Screen 6: Owner Settings & Analytics</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Salon Owner Control Center</h1>
        </div>

        {/* Master Queue Switch */}
        <div className="flex items-center gap-3 bg-charcoal-800 p-2 rounded-xl border border-charcoal-700">
          <span className="text-xs font-bold text-gray-300">Master Queue Status:</span>
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              isQueueOpen
                ? 'bg-emerald-500 text-charcoal-900'
                : 'bg-rose-500 text-white'
            }`}
          >
            {isQueueOpen ? t('salon.open') : t('salon.closed')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-charcoal-700 pb-3 mb-6 overflow-x-auto">
        {[
          { id: 'services', label: 'Service Catalog & Prices', icon: Scissors },
          { id: 'barbers', label: 'Barber Roster', icon: Users },
          { id: 'analytics', label: 'Daily Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-charcoal-900 shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-charcoal-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Service Catalog */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Configured Services</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-charcoal-900 text-xs font-bold transition">
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-900/80 border-b border-charcoal-700 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Service Name (EN)</th>
                  <th className="py-3 px-4">Service Name (GU)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price (₹)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700">
                {dummyServices.map((service) => (
                  <tr key={service.id} className="hover:bg-charcoal-700/40">
                    <td className="py-3 px-4 font-bold text-white">{service.name_en}</td>
                    <td className="py-3 px-4 text-gold-400 font-medium">{service.name_gu}</td>
                    <td className="py-3 px-4 text-gray-300">{service.duration} mins</td>
                    <td className="py-3 px-4 font-bold text-white">{t('salon.currency')}{service.price}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Barber Roster */}
      {activeTab === 'barbers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Barber Team</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-charcoal-900 text-xs font-bold transition">
              <Plus className="w-4 h-4" />
              <span>Add Barber</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {dummyBarbers.map((barber) => (
              <div key={barber.id} className="bg-charcoal-800 p-4 rounded-xl border border-charcoal-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gold-400">Chair #{barber.chair}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-charcoal-700 text-gray-300">
                    {barber.status}
                  </span>
                </div>
                <div className="text-base font-bold text-white">{barber.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Active Client: {barber.customerName || 'None'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Daily Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700">
            <span className="text-xs text-gray-400">Total Customers Today</span>
            <div className="text-3xl font-black text-white mt-2">14</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">+4 vs yesterday</span>
          </div>
          <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700">
            <span className="text-xs text-gray-400">Avg Customer Wait Time</span>
            <div className="text-3xl font-black text-gold-400 mt-2">22 mins</div>
            <span className="text-[11px] text-gray-400 mt-1 block">Optimal threshold &lt; 30m</span>
          </div>
          <div className="bg-charcoal-800 p-5 rounded-2xl border border-charcoal-700">
            <span className="text-xs text-gray-400">Est. Revenue Generated</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">₹3,450</div>
            <span className="text-[11px] text-gray-400 mt-1 block">Settled in cash / counter UPI</span>
          </div>
        </div>
      )}
    </div>
  );
}
