import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, History, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';
import { BAND_HEX, BAND_LABEL, scoreBand } from '../lib/analysis';

interface Scan {
  id: number;
  product_name: string;
  safety_score: number;
  flags_found: number;
  scanned_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ScanHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('scan_history')
        .select('id, product_name, safety_score, flags_found, scanned_at')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false });
      if (err) throw err;
      setScans(data ?? []);
    } catch (err: unknown) {
      const message = errorMessage(err, 'Could not load your scan history.');
      setError(
        message.includes('schema cache') || message.includes('does not exist')
          ? 'Scan history is not set up yet — run supabase/scan_history_rls.sql in your Supabase SQL Editor.'
          : message
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#faf5ef] py-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#e8aa80]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#ffe4c9]/40 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative max-w-2xl mx-auto"
      >
        <button
          type="button"
          onClick={() => navigate('/landing')}
          className="inline-flex items-center gap-2 text-[#8c735c] hover:text-[#a24809] transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6">
            <History className="w-8 h-8 text-[#a24809]" />
          </div>
          <h1 className="text-4xl font-display font-bold text-[#a24809] mb-3">Your scan history</h1>
          <p className="text-[#8c735c] text-lg max-w-md mx-auto">
            Every product you've analyzed, with its safety score.
          </p>
        </div>

        {loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#a24809]" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && scans.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#e8aa80]/20">
            <p className="text-[#8c735c] mb-4">You haven't analyzed any products yet.</p>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#a24809] text-white text-sm font-semibold hover:bg-[#8a3a07] transition-colors"
            >
              <Search className="w-4 h-4" />
              Check a product
            </button>
          </div>
        )}

        {!loading && !error && scans.length > 0 && (
          <ul className="space-y-3">
            {scans.map((scan) => {
              const band = scoreBand(scan.safety_score);
              return (
                <li
                  key={scan.id}
                  className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-[#e8aa80]/20"
                >
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 font-display font-extrabold"
                    style={{ backgroundColor: `${BAND_HEX[band]}1a`, color: BAND_HEX[band] }}
                  >
                    {scan.safety_score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#604f42] truncate">{scan.product_name}</p>
                    <p className="text-sm text-[#8c735c]">
                      <span style={{ color: BAND_HEX[band] }}>{BAND_LABEL[band]}</span>
                      {' · '}
                      {scan.flags_found} flag{scan.flags_found === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-xs text-[#c4b39c] shrink-0">{formatDate(scan.scanned_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
