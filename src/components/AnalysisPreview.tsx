import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, Leaf, ShieldAlert } from 'lucide-react';

// A representative result, using real entries from the ingredient database.
const SAMPLE = {
  product: 'Age Defying Hand Cream',
  brand: 'Himalaya · Moisturiser',
  score: 85,
  band: 'Great choice',
  flags: [
    { name: 'Synthetic Fragrance', risk: 'Medium risk', color: '#c87840',
      concern: 'Umbrella term hiding 3000+ possible chemicals, a common cause of allergic reactions.' },
    { name: 'Phenoxyethanol', risk: 'Low risk', color: '#c9a227',
      concern: 'Can cause skin irritation in higher concentrations.' },
  ],
  personal: 'You told us your skin is sensitive — this product has 1 ingredient that can trigger irritation.',
  good: 'Aloe Barbadensis · soothes and hydrates',
};

/** Counts up to `to` once the ring scrolls into view. */
function useCountUp(to: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out so it decelerates into the final number
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return value;
}

export default function AnalysisPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const score = useCountUp(SAMPLE.score, inView);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-serif italic font-light text-[#a24809] mb-4">
            See it in action
          </h2>
          <p className="text-lg text-[#8c735c] max-w-2xl mx-auto">
            Here's what you get back — a score, the ingredients worth knowing about, and what it
            means for your skin.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="bg-[#faf5ef] rounded-3xl p-6 sm:p-8 shadow-lg border border-[#e8aa80]/30"
        >
          <div className="mb-5">
            <p className="font-display font-bold text-[#604f42] text-lg">{SAMPLE.product}</p>
            <p className="text-sm text-[#8c735c]">{SAMPLE.brand}</p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-5 mb-5 pt-5 border-t border-[#e8aa80]/20">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#f0e6d8" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r={radius} fill="none"
                  stroke="#3f7d4d" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-display font-extrabold text-[#3f7d4d]">{score}</span>
                <span className="text-[10px] text-[#8c735c] -mt-0.5">out of 100</span>
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-[#e9f4ec] text-[#3f7d4d] mb-1.5">
                {SAMPLE.band}
              </span>
              <p className="text-sm text-[#8c735c]">
                {SAMPLE.flags.length} ingredients worth knowing about, out of 44.
              </p>
            </div>
          </div>

          {/* Personalized note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white text-sm text-[#604f42] mb-4">
            <ShieldAlert className="w-4 h-4 text-[#a24809] shrink-0 mt-0.5" />
            <span>{SAMPLE.personal}</span>
          </div>

          {/* Flags */}
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#a24809] mb-2">
            <AlertTriangle className="w-4 h-4" />
            Worth knowing about
          </h4>
          <ul className="space-y-2 mb-4">
            {SAMPLE.flags.map((f) => (
              <li key={f.name} className="p-3 rounded-xl bg-white">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#604f42]">{f.name}</span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium shrink-0"
                    style={{ color: f.color }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                    {f.risk}
                  </span>
                </div>
                <p className="text-xs text-[#8c735c]">{f.concern}</p>
              </li>
            ))}
          </ul>

          {/* Beneficial */}
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#5e7d2f] mb-2">
            <Leaf className="w-4 h-4" />
            Skin-friendly ingredients
          </h4>
          <div className="p-3 rounded-xl bg-[#f1f5e6] text-sm text-[#5e7d2f]">{SAMPLE.good}</div>

          <p className="text-[11px] text-[#c4b39c] mt-4">
            Example of a real analysis. Your results are personalised to your own skin profile.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
