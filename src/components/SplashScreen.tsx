import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#faf5ef]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      <motion.span
        className="font-display font-extrabold text-[#a24809] select-none"
        style={{ fontSize: 'clamp(4rem, 12vw, 10rem)', letterSpacing: '-0.02em' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        SkinTel.
      </motion.span>
    </motion.div>
  );
}
