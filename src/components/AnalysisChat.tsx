import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { ChatMessage } from '../lib/analysis';

const SUGGESTIONS = [
  'Is this okay for daily use?',
  'Explain the flagged ingredients simply',
  'Is there a gentler alternative?',
];

export default function AnalysisChat({
  messages,
  sending,
  errored,
  onSend,
}: {
  messages: ChatMessage[]; // follow-up turns only (summary excluded)
  sending: boolean;
  errored: boolean;
  onSend: (text: string) => void;
  }) {
  const [input, setInput] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#e8aa80]/20">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageCircle className="w-4 h-4 text-[#a24809]" />
        <span className="text-xs font-semibold text-[#a24809] uppercase tracking-wide">
          Ask SkinTel
        </span>
      </div>

      {/* Conversation thread */}
      {messages.length > 0 && (
        <div ref={threadRef} className="space-y-2.5 mb-3 max-h-72 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#a24809] text-white rounded-br-md'
                    : 'bg-[#faf5ef] text-[#604f42] rounded-bl-md'
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-[#faf5ef] text-[#8c735c] text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                SkinTel is typing…
              </div>
            </div>
          )}
          {errored && !sending && (
            <p className="text-xs text-[#c4b39c] italic">
              Couldn't get a reply just now — try asking again.
            </p>
          )}
        </div>
      )}

      {/* Suggestion chips (only before the first question) */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={sending}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#faf5ef] text-[#8c735c] border border-[#e8aa80]/40 hover:border-[#a24809] hover:text-[#a24809] transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question…"
          aria-label="Ask SkinTel a question"
          className="flex-1 py-2.5 px-4 rounded-full bg-[#faf5ef] border-2 border-transparent text-sm text-[#604f42] placeholder:text-[#c4b39c] focus:outline-none focus:border-[#e8aa80] focus:bg-white transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => submit(input)}
          disabled={sending || !input.trim()}
          aria-label="Send question"
          className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
            sending || !input.trim()
              ? 'bg-[#faf5ef] text-[#c4b39c] cursor-not-allowed'
              : 'bg-[#a24809] text-white hover:bg-[#8a3a07]'
          }`}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
