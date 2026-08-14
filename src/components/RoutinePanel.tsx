import { motion } from 'framer-motion';
import { Check, Layers } from 'lucide-react';
import { RoutineResult, Severity } from '../lib/interactions';

const SEV: Record<Severity, { label: string; color: string; bg: string }> = {
  high: { label: 'Best avoided together', color: '#c0392b', bg: '#fbe6e3' },
  moderate: { label: 'Use with care', color: '#a24809', bg: '#ffe4c9' },
  low: { label: 'Minor', color: '#c9a227', bg: '#faf5ef' },
};

export default function RoutinePanel({ result }: { result: RoutineResult }) {
  const { conflicts } = result;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-[#e8aa80]/20">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-[#a24809]" />
          <h3 className="font-display font-bold text-[#a24809]">Routine check</h3>
        </div>

        {conflicts.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e9f4ec] text-sm text-[#3f7d4d]">
            <Check className="w-4 h-4 shrink-0" />
            No conflicting actives found — these products look fine to use together.
          </div>
        ) : (
          <>
            <p className="text-sm text-[#8c735c] mb-3">
              {conflicts.length} combination{conflicts.length > 1 ? 's' : ''} worth being careful with
              when layering:
            </p>
            <ul className="space-y-2.5">
              {conflicts.map((c, i) => {
                const sev = SEV[c.severity];
                return (
                  <li key={i} className="p-3 rounded-xl bg-[#faf5ef]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#604f42]">{c.title}</span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-lg shrink-0"
                        style={{ color: sev.color, backgroundColor: sev.bg }}
                      >
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#8c735c]">{c.message}</p>
                    <p className="text-xs text-[#a24809] font-medium mt-1">Tip: {c.advice}</p>
                    <p className="text-[11px] text-[#c4b39c] mt-1">
                      In your shelf: {c.products.join(', ')}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <p className="text-[11px] text-[#c4b39c] mt-3 leading-relaxed">
          Based on common ingredient-layering guidance, not medical advice. Patch-test and
          introduce new actives one at a time.
        </p>
      </div>
    </motion.div>
  );
}
