import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function AuthChoicePage() {
  return (
    <div className="min-h-screen bg-[#faf5ef] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#e8aa80]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#ffe4c9]/40 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative w-full max-w-2xl"
      >
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/logo.png" alt="SkinTel Logo" className="w-20 h-20 object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#a24809] mb-4">
            Welcome to SkinTel.
          </h1>
          <p className="text-lg text-[#8c735c] max-w-md mx-auto">
            Choose how you'd like to continue
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          className="grid sm:grid-cols-2 gap-6"
        >
          <motion.div variants={fadeInUp}>
            <Link to="/signin" className="block group">
              <div className="relative bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-[#e8aa80] transition-all duration-300 h-full">
                <div className="absolute top-6 right-6 text-5xl font-display font-extrabold text-[#e8aa80]/50">
                  01
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                  <LogIn className="w-8 h-8 text-[#a24809]" />
                </div>
                <h2 className="text-2xl font-display font-bold text-[#a24809] mb-3">
                  Sign In
                </h2>
                <p className="text-[#8c735c] leading-relaxed mb-8">
                  Already have an account? Sign in to pick up where you left off.
                </p>
                <span className="inline-block w-full py-3.5 rounded-2xl bg-[#a24809] text-white font-semibold text-center group-hover:bg-[#8a3a07] transition-colors duration-300">
                  Sign In
                </span>
              </div>
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Link to="/signup" className="block group">
              <div className="relative bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-[#e8aa80] transition-all duration-300 h-full">
                <div className="absolute top-6 right-6 text-5xl font-display font-extrabold text-[#e8aa80]/50">
                  02
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                  <UserPlus className="w-8 h-8 text-[#a24809]" />
                </div>
                <h2 className="text-2xl font-display font-bold text-[#a24809] mb-3">
                  Sign Up
                </h2>
                <p className="text-[#8c735c] leading-relaxed mb-8">
                  New here? Create a free account and start scanning your products.
                </p>
                <span className="inline-block w-full py-3.5 rounded-2xl bg-[#a24809] text-white font-semibold text-center group-hover:bg-[#8a3a07] transition-colors duration-300">
                  Sign Up
                </span>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
