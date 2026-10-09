/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SalonProvider } from './context/SalonContext';
import { Header, PublicPageView } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { ServicesView } from './views/ServicesView';
import { BookingView } from './views/BookingView';
import { PrivacyView } from './views/PrivacyView';
import { AdminView } from './views/AdminView';

export default function App() {
  const [currentView, setCurrentView] = useState<PublicPageView>('home');
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);

  const handleNavigate = (view: PublicPageView, sectionId?: string) => {
    setCurrentView(view);
    if (view === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStartBookingWithService = (serviceId: string) => {
    setPreselectedServiceId(serviceId);
    setCurrentView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SalonProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF8F6] text-[#2A2628]">
        <Header currentView={currentView} onNavigate={handleNavigate} />

        <main className="flex-1">
          {currentView === 'home' && (
            <HomeView
              onNavigate={handleNavigate}
              onStartBookingWithService={handleStartBookingWithService}
            />
          )}

          {currentView === 'services' && (
            <ServicesView
              onStartBookingWithService={handleStartBookingWithService}
              onGoToBooking={() => handleNavigate('booking')}
            />
          )}

          {currentView === 'booking' && (
            <BookingView
              initialServiceId={preselectedServiceId}
              onOpenPrivacy={() => handleNavigate('privacy')}
              onFinishToHome={() => {
                setPreselectedServiceId(null);
                handleNavigate('home');
              }}
            />
          )}

          {currentView === 'privacy' && (
            <PrivacyView onBack={() => handleNavigate('booking')} />
          )}

          {currentView === 'admin' && <AdminView />}
        </main>

        <Footer onNavigate={handleNavigate} />
      </div>
    </SalonProvider>
  );
}

