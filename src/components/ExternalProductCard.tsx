import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Loader2, X } from 'lucide-react';
import { analyzeProduct, AnalysisResult, UserProfile } from '../lib/analysis';
import { ExternalMatch } from '../lib/barcode';
import { errorMessage } from '../lib/errors';
import AnalysisPanel from './AnalysisPanel';

/**
 * A scanned product that isn't in our catalog but was found in Open Beauty
 * Facts. Its ingredients still run through the same analysis; it just can't be
 * saved to the shelf, since the shelf references catalog rows.
 */
export default function ExternalProductCard({
  match,
  profile,
  onDismiss,
}: {
  match: ExternalMatch;
  profile: UserProfile;
  onDismiss: () => void;
}) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    analyzeProduct(match.ingredients, profile)
      .then((r) => {
        if (active) setResult(r);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, 'Could not analyze this product.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [match, profile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white rounded-2xl px-5 py-4 shadow-sm border border-[#e8aa80]/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {match.imageUrl && (
            <img
              src={match.imageUrl}
              alt=""
              className="w-12 h-12 rounded-xl object-contain bg-[#faf5ef] shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-[#604f42] truncate">{match.product_name}</p>
            <p className="text-sm text-[#8c735c]">{match.brand}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#c4b39c]">
              <Globe className="w-3 h-3" />
              From Open Beauty Facts · not in our catalog
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss scanned product"
          className="p-2 rounded-full text-[#c4b39c] hover:text-[#a24809] hover:bg-[#faf5ef] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#a24809]" />
        </div>
      )}

      {!loading && error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && match.ingredients.length === 0 && (
        <p className="mt-3 text-sm text-[#8c735c]">
          This product has no ingredient list on record, so there's nothing to analyze yet.
        </p>
      )}

      {!loading && !error && result && match.ingredients.length > 0 && (
        <AnalysisPanel result={result} />
      )}
    </motion.div>
  );
}
