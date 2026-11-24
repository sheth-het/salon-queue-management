import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from '../components/common/StatusBadge';
import { dummyQueueTokens, dummyBarbers } from '../data/dummyData';
import { Users, UserPlus, Phone, Clock, Search, MoreHorizontal, Bell, CheckCircle } from 'lucide-react';

export default function ReceptionistPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = dummyQueueTokens.filter((token) => {
    if (activeTab !== 'all' && token.status !== activeTab) return false;
    if (searchTerm) {
      return (
        token.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Receptionist Command Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Screen 3: Receptionist Queue Management</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Receptionist Command Center</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/walk-in"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-bold text-xs tracking-wide transition shadow-lg shadow-gold-500/10"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ New Walk-In Customer</span>
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-charcoal-800 p-3.5 rounded-xl border border-charcoal-700">
          <span className="text-xs text-gray-400">Waiting in Queue</span>
          <div className="text-2xl font-black text-amber-400 mt-1">3</div>
        </div>
        <div className="bg-charcoal-800 p-3.5 rounded-xl border border-charcoal-700">
          <span className="text-xs text-gray-400">Currently in Chairs</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">2</div>
        </div>
        <div className="bg-charcoal-800 p-3.5 rounded-xl border border-charcoal-700">
          <span className="text-xs text-gray-400">Average Wait Today</span>
          <div className="text-2xl font-black text-gold-400 mt-1">~22m</div>
        </div>
        <div className="bg-charcoal-800 p-3.5 rounded-xl border border-charcoal-700">
          <span className="text-xs text-gray-400">Total Served Today</span>
          <div className="text-2xl font-black text-white mt-1">14</div>
        </div>
      </div>

      {/* Queue Filter Bar */}
      <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'waiting', 'called', 'in_service'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab
                  ? 'bg-gold-500 text-charcoal-900'
                  : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Token or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-charcoal-900/80 border-b border-charcoal-700 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Services</th>
                <th className="py-3 px-4">Barber / Chair</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700">
              {filteredTokens.map((item) => (
                <tr key={item.id} className="hover:bg-charcoal-700/50 transition">
                  <td className="py-3.5 px-4 font-black text-sm text-gold-400">
                    #{item.tokenNumber}
                    <span className="block text-[10px] text-gray-500 uppercase font-normal">{item.source}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{item.customerName}</div>
                    <div className="text-gray-400 text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {item.phone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-300">
                    <div>{item.services.join(', ')}</div>
                    <div className="text-[11px] text-gray-500">{item.totalDuration} mins • {t('salon.currency')}{item.totalPrice}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-gray-200">
                      {item.barberName || 'Unassigned'}
                    </span>
                    {item.chair && (
                      <span className="block text-[11px] text-gold-400">Chair #{item.chair}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Call Customer"
                        className="p-1.5 rounded-lg bg-gold-500/15 text-gold-400 hover:bg-gold-500 hover:text-charcoal-900 transition border border-gold-500/30"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Start Service"
                        className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white transition border border-emerald-500/30"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
