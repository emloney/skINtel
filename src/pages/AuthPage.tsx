import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowLeft } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode: AuthMode = location.pathname === '/signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setMode(location.pathname === '/signup' ? 'signup' : 'signin');
  }, [location.pathname]);

  const isSignUp = mode === 'signup';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    navigate(next === 'signup' ? '/signup' : '/signin', { replace: true });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Frontend-only placeholder — wire up your auth backend here later
    console.log(isSignUp ? 'Sign up' : 'Sign in', { name, email, password });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#faf5ef] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#e8aa80]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#ffe4c9]/40 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Back to home */}
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-[#8c735c] hover:text-[#a24809] transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-[#e8aa80]/20">
          <div className="absolute top-6 right-6 text-5xl font-display font-extrabold text-[#e8aa80]/40 select-none">
            {isSignUp ? '01' : '02'}
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="SkinTel Logo" className="w-12 h-12 object-contain mix-blend-multiply" />
            <span className="font-display font-bold text-2xl text-[#a24809]">SkinTel.</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-display font-bold text-[#a24809] mb-2">
                {isSignUp ? 'Create an Account' : 'Welcome Back'}
              </h1>
              <p className="text-[#8c735c] mb-8">
                {isSignUp
                  ? 'Join SkinTel and start scanning your skincare products today.'
                  : 'Sign in to continue checking your skincare products.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Mode toggle tabs */}
          <div className="flex bg-[#faf5ef] rounded-2xl p-1 mb-8">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                !isSignUp
                  ? 'bg-white text-[#a24809] shadow-sm'
                  : 'text-[#8c735c] hover:text-[#a24809]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isSignUp
                  ? 'bg-white text-[#a24809] shadow-sm'
                  : 'text-[#8c735c] hover:text-[#a24809]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <label htmlFor="name" className="auth-label">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a24809]/60" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="auth-input pl-12"
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a24809]/60" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a24809]/60" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input pl-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-[#8c735c] hover:text-[#a24809] transition-colors"
                  onClick={() => console.log('Forgot password')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl bg-[#a24809] text-white font-semibold text-base hover:bg-[#8a3a07] transition-colors duration-300 shadow-md shadow-[#a24809]/20"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-[#8c735c]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
              className="font-semibold text-[#a24809] hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
