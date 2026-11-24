import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/common/Header';

import HomePage from './pages/HomePage';
import CustomerJoinPage from './pages/CustomerJoinPage';
import CustomerStatusPage from './pages/CustomerStatusPage';
import ReceptionistPage from './pages/ReceptionistPage';
import WalkInPage from './pages/WalkInPage';
import BarberPage from './pages/BarberPage';
import TVDisplayPage from './pages/TVDisplayPage';
import OwnerPage from './pages/OwnerPage';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-charcoal-900 text-gray-100 flex flex-col font-sans">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Home / Role Switcher Portal */}
              <Route path="/" element={<HomePage />} />
              {/* Screen 1: Customer Queue Join */}
              <Route path="/join" element={<CustomerJoinPage />} />
              {/* Screen 2: Customer Live Token Status */}
              <Route path="/status" element={<CustomerStatusPage />} />
              {/* Screen 3: Receptionist Queue Management */}
              <Route path="/receptionist" element={<ReceptionistPage />} />
              {/* Screen 3 Walk-In: Fast Walk-In Entry */}
              <Route path="/walk-in" element={<WalkInPage />} />
              {/* Screen 4: Barber Station Dashboard */}
              <Route path="/barber" element={<BarberPage />} />
              {/* Screen 5: Waiting Area TV Display */}
              <Route path="/tv" element={<TVDisplayPage />} />
              {/* Screen 6: Owner Settings & Analytics */}
              <Route path="/owner" element={<OwnerPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
