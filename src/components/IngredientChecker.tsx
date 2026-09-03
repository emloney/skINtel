import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Leaf, Search } from 'lucide-react';
import { loadReferenceData, ReferenceData, RiskLevel } from '../lib/analysis';

const RISK_COLOR: Record<RiskLevel, string> = {
  high: '#c0392b',
  medium: '#c87840',
  low: '#c9a227',
};
const RISK_LABEL: Record<RiskLevel, string> = {
  high: 'High risk',
  medium: 'Medium risk',
  low: 'Low risk',
};

const EXAMPLES = ['Fragrance', 'Niacinamide', 'Paraben', 'Neem'];

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

type Verdict =
  | { kind: 'harmful'; name: string; risk: RiskLevel; does: string | null; concern: string | null; safer: string | null }
  | { kind: 'good'; name: string; benefit: string | null }
  | { kind: 'clear'; term: string }
  | null;

/**
 * Try-before-you-sign-up widget: look up any ingredient against the same
 * reference tables the full analysis uses. Data is fetched once and filtered
 * locally, so typing feels instant.
 */
export default function IngredientChecker() {
  const [ref, setRef] = useState<ReferenceData | null>(null);
  const [term, setTerm] = useState('');

  useEffect(() => {
    let active = true;
    loadReferenceData()
      .then((r) => active && setRef(r))
      .catch(() => {
        /* leave the widget idle if reference data can't load */
      });
    return () => {
      active = false;
    };
  }, []);

  const verdict = useMemo<Verdict>(() => {
    const q = norm(term);
    if (!ref || q.length < 3) return null;

    // Short or empty aliases would otherwise match every query, so ignore them.
    const matches = (name: string, aliases: string[] | null) =>
      [name, ...(aliases ?? [])]
        .map((n) => norm(n ?? ''))
        .filter((v) => v.length >= 3)
        .some((v) => v.includes(q) || q.includes(v));

    const bad = ref.harmful.find((h) => matches(h.name, h.aliases));
    if (bad) {
      return {
        kind: 'harmful',
        name: bad.name,
        risk: bad.risk_level,
        does: bad.what_it_does,
        concern: bad.health_concern,
        safer: bad.safer_alternative,
      };
    }

    const good = ref.ayurvedic.find((a) =>
      matches(a.indian_name, [a.inci_name ?? '', ...(a.aliases ?? [])])
    );
    if (good) {
      return { kind: 'good', name: good.inci_name || good.indian_name, benefit: good.benefit };
    }

    return { kind: 'clear', term: term.trim() };
  }, [term, ref]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b39c] pointer-events-none" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Try an ingredient — fragrance, niacinamide…"
          aria-label="Check an ingredient"
          className="w-full py-3 pl-11 pr-4 rounded-full bg-white/95 backdrop-blur border-2 border-white/60 text-sm text-[#604f42] placeholder:text-[#c4b39c] focus:outline-none focus:border-white shadow-lg"
        />
      </div>

      {/* Example chips, until the user types */}
      {!term.trim() && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setTerm(e)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* No mode="wait": a live search should swap results immediately rather
          than waiting for the previous one to fade out. */}
      <AnimatePresence initial={false}>
        {verdict && (
          <motion.div
            key={verdict.kind + ('name' in verdict ? verdict.name : verdict.term)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-3 p-4 rounded-2xl bg-white/95 backdrop-blur text-left shadow-lg"
          >
            {verdict.kind === 'harmful' && (
              <>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-[#604f42] text-sm">{verdict.name}</span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium shrink-0"
                    style={{ color: RISK_COLOR[verdict.risk] }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {RISK_LABEL[verdict.risk]}
                  </span>
                </div>
                {verdict.concern && <p className="text-xs text-[#8c735c]">{verdict.concern}</p>}
                {verdict.safer && (
                  <p className="text-xs text-[#5e7d2f] mt-1.5">Try instead: {verdict.safer}</p>
                )}
              </>
            )}

            {verdict.kind === 'good' && (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <Leaf className="w-3.5 h-3.5 text-[#5e7d2f]" />
                  <span className="font-semibold text-[#5e7d2f] text-sm">{verdict.name}</span>
                </div>
                {verdict.benefit && <p className="text-xs text-[#8c735c]">{verdict.benefit}</p>}
              </>
            )}

            {verdict.kind === 'clear' && (
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#3f7d4d] shrink-0 mt-0.5" />
                <p className="text-xs text-[#8c735c]">
                  <span className="font-medium text-[#604f42]">"{verdict.term}"</span> isn't on our
                  flagged list. Sign in to check a whole product at once.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
