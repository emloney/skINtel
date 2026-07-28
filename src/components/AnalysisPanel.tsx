import { motion } from 'framer-motion';
import { AlertTriangle, Ban, Check, Leaf, ShieldAlert, Sparkles } from 'lucide-react';
import { AnalysisResult, BAND_LABEL, ChatMessage, RiskLevel, ScoreBand } from '../lib/analysis';
import AnalysisChat from './AnalysisChat';

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

export default function AnalysisPanel({
  result,
  conversation,
  aiLoading,
  aiFailed,
  chatSending,
  chatErrored,
  onSendMessage,
}: {
  result: AnalysisResult;
  conversation?: ChatMessage[];
  aiLoading?: boolean;
  aiFailed?: boolean;
  chatSending?: boolean;
  chatErrored?: boolean;
  onSendMessage?: (text: string) => void;
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

        {/* Flagged ingredients */}
        {result.flags.length > 0 && (
          <div className="mb-4">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#a24809] mb-2">
              <AlertTriangle className="w-4 h-4" />
              Worth knowing about
            </h4>
            <ul className="space-y-2">
              {result.flags.map((f, i) => (
                <li key={i} className="p-3 rounded-xl bg-[#faf5ef]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#604f42]">{f.matched}</span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium shrink-0"
                      style={{ color: RISK_COLOR[f.riskLevel] }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: RISK_COLOR[f.riskLevel] }}
                      />
                      {RISK_LABEL[f.riskLevel]}
                    </span>
                  </div>
                  {f.concern && <p className="text-xs text-[#8c735c]">{f.concern}</p>}
                  {f.personal && (
                    <p className="text-xs font-medium text-[#a24809] mt-1">{f.personal}</p>
                  )}
                  {f.saferAlternative && (
                    <p className="text-xs text-[#8c735c] mt-1">
                      <span className="text-[#5e7d2f] font-medium">Try instead:</span>{' '}
                      {f.saferAlternative}
                    </p>
                  )}
                </li>
              ))}
            </ul>
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
