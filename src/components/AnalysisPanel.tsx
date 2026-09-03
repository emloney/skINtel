import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Ban, Baby, Check, ChevronDown, Leaf, ShieldAlert, Sparkles } from 'lucide-react';
import { AnalysisResult, BAND_LABEL, ChatMessage, Flag, RiskLevel, ScoreBand } from '../lib/analysis';
import AnalysisChat from './AnalysisChat';
import ReportReaction from './ReportReaction';

const BAND_COLOR: Record<ScoreBand, { ring: string; text: string; bg: string }> = {
  excellent: { ring: '#3f7d4d', text: '#3f7d4d', bg: '#e9f4ec' },
  good: { ring: '#7a9e42', text: '#5e7d2f', bg: '#f1f5e6' },
  caution: { ring: '#c87840', text: '#a24809', bg: '#ffe4c9' },
  avoid: { ring: '#c0392b', text: '#a5281b', bg: '#fbe6e3' },
};

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

function ScoreRing({ score, band }: { score: number; band: ScoreBand }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = BAND_COLOR[band];

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#f0e6d8" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color.ring}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-display font-extrabold" style={{ color: color.text }}>
          {score}
        </span>
        <span className="text-[10px] text-[#8c735c] -mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

/**
 * One flagged ingredient. Collapsed it's a single scannable line; the detail
 * only appears when asked for, so a long ingredient list stays readable.
 */
function FlagRow({ flag, defaultOpen = false }: { flag: Flag; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = RISK_COLOR[flag.riskLevel];

  return (
    <li className="rounded-xl bg-[#faf5ef] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f4e9dc] transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="flex-1 text-sm font-semibold text-[#604f42] truncate">{flag.matched}</span>
        {flag.personal && (
          <ShieldAlert className="w-3.5 h-3.5 text-[#a24809] shrink-0" aria-label="Relevant to your profile" />
        )}
        <span className="text-xs font-medium shrink-0 hidden sm:inline" style={{ color }}>
          {RISK_LABEL[flag.riskLevel]}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#c4b39c] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1">
              {flag.concern && <p className="text-xs text-[#8c735c] leading-relaxed">{flag.concern}</p>}
              {flag.personal && (
                <p className="text-xs font-medium text-[#a24809]">{flag.personal}</p>
              )}
              {flag.saferAlternative && (
                <p className="text-xs text-[#8c735c]">
                  <span className="text-[#5e7d2f] font-medium">Try instead:</span>{' '}
                  {flag.saferAlternative}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Low-risk findings, tucked away so they don't crowd the important ones. */
function MinorFlags({ flags }: { flags: Flag[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#8c735c] hover:text-[#a24809] transition-colors"
      >
        {open ? 'Hide' : 'Show'} {flags.length} minor ingredient{flags.length > 1 ? 's' : ''}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1.5 overflow-hidden"
          >
            {flags.map((f, i) => (
              <FlagRow key={i} flag={f} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalysisPanel({
  result,
  conversation,
  aiLoading,
  aiFailed,
  chatSending,
  chatErrored,
  onSendMessage,
  brand,
  productName,
}: {
  result: AnalysisResult;
  conversation?: ChatMessage[];
  aiLoading?: boolean;
  aiFailed?: boolean;
  chatSending?: boolean;
  chatErrored?: boolean;
  onSendMessage?: (text: string) => void;
  brand?: string;
  productName?: string;
}) {
  const color = BAND_COLOR[result.band];
  const clean = result.flags.length === 0 && result.banned.length === 0;
  // conversation[0] is the opening AI summary; the rest are follow-up turns.
  const summary = conversation?.[0]?.content;
  const followUps = conversation ? conversation.slice(1) : [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="mt-4 pt-5 border-t border-[#e8aa80]/20">
        {/* Score header */}
        <div className="flex items-center gap-5 mb-5">
          <ScoreRing score={result.score} band={result.band} />
          <div className="min-w-0">
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-1.5"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {BAND_LABEL[result.band]}
            </span>
            <p className="text-sm text-[#8c735c]">
              {result.banned.length > 0
                ? `Contains ${result.banned.length} restricted ingredient${
                    result.banned.length > 1 ? 's' : ''
                  }.`
                : clean
                ? 'No flagged ingredients found in our database.'
                : `${result.flags.length} ingredient${
                    result.flags.length > 1 ? 's' : ''
                  } worth knowing about, out of ${result.totalIngredients}.`}
            </p>
          </div>
        </div>

        {/* AI summary (bonus layer) */}
        {(aiLoading || summary) && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#fff3e6] to-[#ffe4c9]/50 border border-[#e8aa80]/40">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-[#a24809]" />
              <span className="text-xs font-semibold text-[#a24809] uppercase tracking-wide">
                SkinTel summary
              </span>
            </div>
            {aiLoading && !summary ? (
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-[#e8aa80]/30 animate-pulse" />
                <div className="h-3 rounded-full bg-[#e8aa80]/30 animate-pulse w-11/12" />
                <div className="h-3 rounded-full bg-[#e8aa80]/30 animate-pulse w-3/4" />
              </div>
            ) : (
              <p className="text-sm text-[#604f42] leading-relaxed">{summary}</p>
            )}
          </div>
        )}
        {aiFailed && !summary && (
          <p className="mb-4 text-xs text-[#c4b39c] italic">
            AI summary unavailable right now — the details below are all yours.
          </p>
        )}

        {/* Personalized notes */}
        {result.personalNotes.length > 0 && (
          <div className="mb-4 space-y-2">
            {result.personalNotes.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 rounded-xl bg-[#faf5ef] text-sm text-[#604f42]"
              >
                <ShieldAlert className="w-4 h-4 text-[#a24809] shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}

        {/* Banned / restricted */}
        {result.banned.length > 0 && (
          <div className="mb-4">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#a5281b] mb-2">
              <Ban className="w-4 h-4" />
              Restricted ingredients
            </h4>
            <ul className="space-y-2">
              {result.banned.map((b, i) => (
                <li key={i} className="p-3 rounded-xl bg-[#fbe6e3] border border-[#e8c4bf]">
                  <p className="text-sm font-semibold text-[#a5281b]">{b.matched}</p>
                  {b.reason && <p className="text-xs text-[#8c735c] mt-0.5">{b.reason}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Teen / tween warnings */}
        {result.teenWarnings.length > 0 && (
          <div className="mb-4">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#a24809] mb-2">
              <Baby className="w-4 h-4" />
              Not ideal for teen/tween skin
            </h4>
            <ul className="space-y-2">
              {result.teenWarnings.map((w, i) => (
                <li key={i} className="p-3 rounded-xl bg-[#ffe4c9]/40 border border-[#e8aa80]/40">
                  <p className="text-sm font-semibold text-[#604f42]">{w.category}</p>
                  <p className="text-xs text-[#8c735c] mt-0.5">{w.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Flagged ingredients */}
        {result.flags.length > 0 && (
          <div className="mb-4">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#a24809] mb-2">
              <AlertTriangle className="w-4 h-4" />
              Worth knowing about
            </h4>
            {(() => {
              // Anything low-risk and not personally relevant is "minor" and
              // gets tucked away, so the list leads with what actually matters.
              const major = result.flags.filter((f) => f.riskLevel !== 'low' || f.personal);
              const minor = result.flags.filter((f) => f.riskLevel === 'low' && !f.personal);
              return (
                <>
                  {major.length > 0 && (
                    <ul className="space-y-1.5">
                      {major.map((f, i) => (
                        <FlagRow key={i} flag={f} defaultOpen={major.length === 1} />
                      ))}
                    </ul>
                  )}
                  {minor.length > 0 && <MinorFlags flags={minor} />}
                </>
              );
            })()}
          </div>
        )}

        {/* Beneficial */}
        {result.beneficial.length > 0 && (
          <div>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#5e7d2f] mb-2">
              <Leaf className="w-4 h-4" />
              Skin-friendly ingredients
            </h4>
            <ul className="space-y-2">
              {result.beneficial.map((b, i) => (
                <li key={i} className="p-3 rounded-xl bg-[#f1f5e6]">
                  <p className="text-sm font-semibold text-[#5e7d2f]">{b.matched}</p>
                  {b.benefit && <p className="text-xs text-[#8c735c] mt-0.5">{b.benefit}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {clean && result.beneficial.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e9f4ec] text-sm text-[#3f7d4d]">
            <Check className="w-4 h-4 shrink-0" />
            None of this product's ingredients matched our flagged-ingredient database.
          </div>
        )}

        {/* Reaction reporting — most relevant when the product scored poorly */}
        {brand && productName && <ReportReaction brand={brand} productName={productName} />}

        {/* Follow-up chat — only once the AI summary is available */}
        {summary && onSendMessage && (
          <AnalysisChat
            messages={followUps}
            sending={!!chatSending}
            errored={!!chatErrored}
            onSend={onSendMessage}
          />
        )}

        <p className="text-[11px] text-[#c4b39c] mt-4 leading-relaxed">
          This is general information based on published ingredient data, not medical advice. Always
          patch-test and consult a dermatologist for specific concerns.
        </p>
      </div>
    </motion.div>
  );
}
