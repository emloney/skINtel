import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import GuestRoute from './components/GuestRoute';
import OnboardingRoute from './components/OnboardingRoute';
import LandingRoute from './components/LandingRoute';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import AuthChoicePage from './pages/AuthChoicePage';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import ProductsPage from './pages/ProductsPage';
import ScanHistoryPage from './pages/ScanHistoryPage';

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <>
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {splashDone && (
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/landing" replace />} />
              <Route
                path="/landing"
                element={
                  <LandingRoute>
                    <HomePage />
                  </LandingRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <OnboardingRoute>
                    <Onboarding />
                  </OnboardingRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <LandingRoute>
                    <ProductsPage />
                  </LandingRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <LandingRoute>
                    <ScanHistoryPage />
                  </LandingRoute>
                }
              />
              <Route
                path="/auth"
                element={
                  <GuestRoute>
                    <AuthChoicePage />
                  </GuestRoute>
                }
              />
              <Route
                path="/signin"
                element={
                  <GuestRoute>
                    <AuthPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <GuestRoute>
                    <AuthPage />
                  </GuestRoute>
                }
              />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      )}
    </>
  );
}

export default App;
