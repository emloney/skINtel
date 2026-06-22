import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import AuthChoicePage from './pages/AuthChoicePage';
import AuthPage from './pages/AuthPage';

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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthChoicePage />} />
            <Route path="/signin" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
