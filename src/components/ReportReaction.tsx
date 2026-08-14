import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flag, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';

const REACTIONS = [
  'Redness or irritation',
  'Breakouts',
  'Itching or burning',
  'Dryness or peeling',
  'Swelling',
  'Something else',
];

/**
 * Lets a user report that a product caused a reaction. Submissions land in
 * community_flags for review — they don't change the product's score.
 */
export default function ReportReaction({
  brand,
  productName,
}: {
  brand: string;
  productName: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (r: string) =>
    setSelected((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const submit = async () => {
    if (!user || selected.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const detail = [selected.join(', '), note.trim()].filter(Boolean).join(' — ');
      const { error: err } = await supabase.from('community_flags').insert({
        user_id: user.id,
        brand,
        product_name: productName,
        note: detail,
        report_type: 'reaction',
        submitted_by: user.email,
        status: 'pending',
      });
      if (err) throw err;
      setDone(true);
    } catch (err: unknown) {
      const message = errorMessage(err, 'Could not send your report.');
      setError(
        message.includes('column') || message.includes('schema cache')
          ? 'Reporting is not set up yet — run supabase/community_flags_setup.sql in your Supabase SQL Editor.'
          : message
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[#e9f4ec] text-sm text-[#3f7d4d]">
        <Check className="w-4 h-4 shrink-0" />
        Thanks — your report helps us flag products that affect real people.
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#faf5ef] text-[#8c735c] text-sm font-medium border border-[#e8aa80]/40 hover:border-[#a24809] hover:text-[#a24809] transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Did this product cause a reaction?
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <div className="p-4 rounded-2xl bg-[#faf5ef] border border-[#e8aa80]/40">
            <p className="text-sm font-semibold text-[#a24809] mb-1">What happened?</p>
            <p className="text-xs text-[#8c735c] mb-3">
              Select everything you noticed. This is reviewed by us — it won't change the score.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggle(r)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border-2 transition-colors ${
                    selected.includes(r)
                      ? 'bg-[#a24809] text-white border-[#a24809]'
                      : 'bg-white text-[#8c735c] border-transparent hover:border-[#e8aa80]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else you want to add? (optional)"
              aria-label="Reaction details"
              rows={2}
              className="w-full py-2.5 px-3 rounded-xl bg-white border-2 border-transparent text-sm text-[#604f42] placeholder:text-[#c4b39c] focus:outline-none focus:border-[#e8aa80] transition-all resize-none"
            />

            {error && <p className="text-xs text-red-700 mt-2">{error}</p>}

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={submit}
                disabled={submitting || selected.length === 0}
                className={`flex-1 py-2.5 rounded-xl bg-[#a24809] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  submitting || selected.length === 0
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-[#8a3a07]'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send report'
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-[#8c735c] text-sm font-medium hover:text-[#a24809] transition-colors"
              >
                Cancel
              </button>
            </div>

            <p className="text-[11px] text-[#c4b39c] mt-2.5">
              If you're having a severe reaction, stop using the product and see a doctor.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
