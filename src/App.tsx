// src/App.tsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { EventsPage } from './pages/EventsPage';
import { NGOsPage } from './pages/NGOsPage';
import { AuthCallbackPage } from './components/AuthCallbackPage';

import { RequireAuth } from './components/RequireAuth';
import { NgoOnboardingPage } from './pages/NgoOnboardingPage';
import { NgoDashboardPage } from './pages/NgoDashboardPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 relative">
        <Toaster position="top-right" />
        <Header />

        <Routes>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={
              <>
                <Hero />
                <EventsPage />
                <NGOsPage />
              </>
            }
          />

          {/* Supabase OAuth callback */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* NGO Onboarding (must be signed in as NGO) */}
          <Route
            path="/ngo/onboarding"
            element={
              <RequireAuth role="ngo">
                <NgoOnboardingPage />
              </RequireAuth>
            }
          />

          {/* NGO Dashboard (must be signed in as NGO) */}
          <Route
            path="/ngo/dashboard"
            element={
              <RequireAuth role="ngo">
                <NgoDashboardPage />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
