import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SPLASH_DURATION_MS = 2200;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  // True once dismissal has been triggered — stops the overlay from eating
  // clicks while it fades out (or while it's stuck invisible-but-mounted).
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    const finish = () => {
      setIsExiting(true);
      onComplete();
    };

    // setTimeout gets throttled/frozen while the tab is backgrounded, which
    // can leave this overlay stuck on top of the app indefinitely. Schedule
    // normally, but also re-check real elapsed time on visibilitychange so a
    // tab that regains focus late dismisses immediately instead of waiting
    // for the (possibly long-delayed) timer to fire.
    const scheduleFinish = () => {
      const remaining = SPLASH_DURATION_MS - (Date.now() - start);
      timer = setTimeout(finish, Math.max(remaining, 0));
    };

    const handleVisibility = () => {
      if (!document.hidden && Date.now() - start >= SPLASH_DURATION_MS) {
        clearTimeout(timer);
        finish();
      }
    };

    scheduleFinish();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#faf5ef]"
      style={{ pointerEvents: isExiting ? 'none' : 'auto' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="object-contain mix-blend-multiply select-none"
          style={{ width: 'clamp(6rem, 18vw, 12rem)' }}
        />
        <span
          className="font-display font-extrabold text-[#a24809] select-none"
          style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', letterSpacing: '-0.02em' }}
        >
          SkinTel.
        </span>
      </motion.div>
    </motion.div>
  );
}
