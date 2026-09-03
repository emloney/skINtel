import { useState } from 'react';
import { Baby } from 'lucide-react';

/**
 * The teen/tween mode mark. Uses public/kids-logo.png when that file exists and
 * quietly falls back to a generic icon if it doesn't, so the badge never breaks.
 */
export default function KidsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Baby className={className} />;

  return (
    <img
      src="/kids-logo.png"
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
