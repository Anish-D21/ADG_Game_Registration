import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { GameInfoPage } from './pages/GameInfoPage.tsx';
import { RulesPage } from './pages/RulesPage.tsx';
import { FaqPage } from './pages/FaqPage.tsx';
import { RegistrationPage } from './pages/RegistrationPage.tsx';
import { RegistrationStatusPage } from './pages/RegistrationStatusPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { PaymentDeskPage } from './pages/PaymentDeskPage.tsx';

export default function App() {
  // Organiser screens are no longer in the nav, so allow ?admin and ?payments
  // as the way in. Both still require a login; this only chooses the view.
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Accept both /admin and ?admin - a path is what people actually type.
    const q = new URLSearchParams(window.location.search);
    const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    if (q.has('admin') || path.endsWith('/admin')) return 'admin';
    if (q.has('payments') || path.endsWith('/payments')) return 'payments';
    return 'home';
  });
  // Empty until a squad is actually registered in this session.
  const [currentRegId, setCurrentRegId] = useState<string>('');

  const handleRegistrationSuccess = (regId: string) => {
    setCurrentRegId(regId);
    setActiveTab('status');
  };

  return (
    <div className="min-h-screen paper-grid-bg text-[#111827] flex flex-col selection:bg-[#E5005A] selection:text-white">
      {/* Global Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'home' && <HomePage setActiveTab={setActiveTab} />}
        {activeTab === 'game' && <GameInfoPage setActiveTab={setActiveTab} />}
        {activeTab === 'rules' && <RulesPage setActiveTab={setActiveTab} />}
        {activeTab === 'faq' && <FaqPage setActiveTab={setActiveTab} />}
        {activeTab === 'register' && <RegistrationPage onSuccess={handleRegistrationSuccess} />}
        {activeTab === 'status' && (
          <RegistrationStatusPage 
            initialRegId={currentRegId} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'admin' && <AdminPage />}
        {activeTab === 'payments' && <PaymentDeskPage />}
      </main>

      {/* Global Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
