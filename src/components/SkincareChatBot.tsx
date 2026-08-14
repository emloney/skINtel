import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';
import { askSkincare, ChatMessage, UserProfile } from '../lib/analysis';

const STARTERS = [
  'What order should I apply my products?',
  'What does niacinamide actually do?',
  'How do I build a simple routine?',
];

const GREETING =
  "Hi! I'm SkinTel — ask me anything about skincare: ingredients, routines, what suits your skin type.";

/**
 * Floating skincare assistant, available across the app. Scoped to skincare
 * topics by the skincare-chat Edge Function and personalized with the user's
 * profile.
 */
export default function SkincareChatBot() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile & { name?: string | null }>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errored, setErrored] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load the profile once so replies can be personalized.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('name, skin_type, skin_concerns, allergies, is_pregnant, age_range')
        .eq('id', user.id)
        .maybeSingle();
      if (!active || !data) return;
      setProfile({
        name: data.name,
        skinType: data.skin_type,
        skinConcerns: data.skin_concerns,
        allergies: data.allergies,
        isPregnant: data.is_pregnant,
        youngSkin: data.age_range === 'Under 18',
      });
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Keep the newest message in view.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setErrored(false);
    setSending(true);

    askSkincare({ messages: next, profile })
      .then((reply) => setMessages([...next, { role: 'assistant', content: reply }]))
      .catch((err) => {
        console.warn('Skincare chat unavailable:', errorMessage(err, 'unknown'));
        setErrored(true);
      })
      .finally(() => setSending(false));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  // Signed-out users have no profile to personalize with; hide the widget.
  if (!user) return null;

  return (
    <>
      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close skincare assistant' : 'Open skincare assistant'}
        className="fixed bottom-6 right-6 z-[120] flex items-center justify-center w-14 h-14 rounded-full bg-[#a24809] text-white shadow-lg shadow-[#a24809]/30 hover:bg-[#8a3a07] transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-[120] w-[22rem] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-xl border border-[#e8aa80]/30 flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(32rem, calc(100vh - 8rem))' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-br from-[#fff3e6] to-[#ffe4c9]/60 border-b border-[#e8aa80]/30">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-[#a24809]" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-[#a24809] text-sm leading-tight">
                  Ask SkinTel
                </p>
                <p className="text-[11px] text-[#8c735c]">Skincare questions only</p>
              </div>
            </div>

            {/* Thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-[#faf5ef] text-[#604f42] text-sm leading-relaxed">
                  {GREETING}
                </div>
              </div>

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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
                    Thinking…
                  </div>
                </div>
              )}

              {errored && !sending && (
                <p className="text-xs text-[#c4b39c] italic px-1">
                  Couldn't reach the assistant — try asking again.
                </p>
              )}

              {/* Starter chips, only before the first question */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-white text-[#8c735c] border border-[#e8aa80]/50 hover:border-[#a24809] hover:text-[#a24809] transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#e8aa80]/20">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a skincare question…"
                aria-label="Ask a skincare question"
                className="flex-1 py-2.5 px-4 rounded-full bg-[#faf5ef] border-2 border-transparent text-sm text-[#604f42] placeholder:text-[#c4b39c] focus:outline-none focus:border-[#e8aa80] focus:bg-white transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                  sending || !input.trim()
                    ? 'bg-[#faf5ef] text-[#c4b39c] cursor-not-allowed'
                    : 'bg-[#a24809] text-white hover:bg-[#8a3a07]'
                }`}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
