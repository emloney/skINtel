import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ScanSearch, X } from 'lucide-react';

export type QuizSkinType = 'Oily' | 'Dry' | 'Combination' | 'Sensitive' | 'Normal';

interface QuizOption {
  label: string;
  points: Partial<Record<QuizSkinType, number>>;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: 'About 30 minutes after washing your face — before applying anything — how does your skin feel?',
    options: [
      { label: 'Tight, rough, or flaky', points: { Dry: 2 } },
      { label: 'Comfortable — not tight, not shiny', points: { Normal: 2 } },
      { label: 'Already getting shiny', points: { Oily: 2 } },
      { label: 'Tight on my cheeks, shiny on my forehead and nose', points: { Combination: 2 } },
    ],
  },
  {
    question: 'By midday, how does your face usually look?',
    options: [
      { label: 'Shiny or greasy all over', points: { Oily: 2 } },
      { label: 'Shiny only on my forehead, nose, or chin', points: { Combination: 2 } },
      { label: 'Dull, matte, or flaky in places', points: { Dry: 2 } },
      { label: 'Pretty much how it looked in the morning', points: { Normal: 2 } },
    ],
  },
  {
    question: 'How visible are your pores?',
    options: [
      { label: 'Large and easy to spot across my face', points: { Oily: 2 } },
      { label: 'Noticeable in my T-zone, small elsewhere', points: { Combination: 2 } },
      { label: 'Small — but my skin often feels rough or dry', points: { Dry: 2 } },
      { label: 'Small and barely noticeable', points: { Normal: 2 } },
    ],
  },
  {
    question: 'How does your skin react when you try new products?',
    options: [
      { label: 'Often stings, burns, or turns red', points: { Sensitive: 3 } },
      { label: 'Sometimes gets itchy or red with certain ingredients', points: { Sensitive: 2 } },
      { label: 'The odd breakout, but no irritation', points: { Oily: 1 } },
      { label: 'Rarely reacts to anything', points: {} },
    ],
  },
  {
    question: 'How often do you deal with breakouts?',
    options: [
      { label: 'Often, and in lots of places', points: { Oily: 2 } },
      { label: 'Mostly around my forehead, nose, or chin', points: { Combination: 2 } },
      { label: 'Rarely — dry patches are my bigger problem', points: { Dry: 2 } },
      { label: 'Hardly ever', points: { Normal: 2 } },
    ],
  },
  {
    question: 'In cold or dry weather, what does your skin do?',
    options: [
      { label: 'Gets flaky, cracked, or feels tight', points: { Dry: 2 } },
      { label: 'Cheeks get dry but my T-zone stays oily', points: { Combination: 2 } },
      { label: 'Still gets shiny or oily', points: { Oily: 2 } },
      { label: 'Turns red, stings, or gets irritated easily', points: { Sensitive: 2 } },
      { label: "Doesn't change much", points: { Normal: 2 } },
    ],
  },
];

const RESULT_INFO: Record<QuizSkinType, string> = {
  Oily: 'Your skin produces extra oil, especially through the T-zone. Lightweight, non-comedogenic products will be your best friends.',
  Dry: 'Your skin loses moisture easily and can feel tight or flaky. Rich, hydrating formulas will keep it comfortable.',
  Combination:
    'Oily through the T-zone, drier on the cheeks — different areas of your face have different needs.',
  Sensitive:
    'Your skin reacts easily to products and the environment. Gentle, fragrance-free formulas work best for you.',
  Normal: 'Your skin is nicely balanced — not too oily, not too dry. Your goal is simply to keep it that way.',
};

// Sensitivity is an override: reactive skin needs gentle products regardless of
// oil balance. Ties between the rest go to the earlier entry in priority order.
function computeResult(answers: number[]): QuizSkinType {
  const scores: Record<QuizSkinType, number> = {
    Oily: 0,
    Dry: 0,
    Combination: 0,
    Normal: 0,
    Sensitive: 0,
  };

  answers.forEach((optionIndex, questionIndex) => {
    const points = QUESTIONS[questionIndex].options[optionIndex].points;
    (Object.keys(points) as QuizSkinType[]).forEach((type) => {
      scores[type] += points[type] ?? 0;
    });
  });

  if (scores.Sensitive >= 3) return 'Sensitive';

  const priority: QuizSkinType[] = ['Combination', 'Oily', 'Dry', 'Normal'];
  let best: QuizSkinType = 'Normal';
  let bestScore = -1;
  for (const type of priority) {
    if (scores[type] > bestScore) {
      best = type;
      bestScore = scores[type];
    }
  }
  return best;
}

type Phase = 'quiz' | 'analyzing' | 'result';

export default function SkinTypeQuiz({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (type: QuizSkinType) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('quiz');
  const [direction, setDirection] = useState(1);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timer = setTimeout(() => setPhase('result'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  const selectOption = (optionIndex: number) => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
    setTimeout(() => {
      setIsAdvancing(false);
      setDirection(1);
      if (step === QUESTIONS.length - 1) {
        setPhase('analyzing');
      } else {
        setStep((s) => s + 1);
      }
    }, 280);
  };

  const goBack = () => {
    if (isAdvancing || step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const retake = () => {
    setAnswers([]);
    setStep(0);
    setDirection(1);
    setPhase('quiz');
  };

  const result = phase === 'result' ? computeResult(answers) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#e8aa80]/20 p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz"
          className="absolute top-5 right-5 p-2 rounded-full text-[#c4b39c] hover:text-[#a24809] hover:bg-[#faf5ef] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {phase === 'quiz' && (
          <div>
            <div className="flex items-center gap-3 mb-6 pr-10">
              <button
                type="button"
                onClick={goBack}
                aria-label="Previous question"
                disabled={step === 0}
                className={`p-2 rounded-full transition-colors ${
                  step === 0
                    ? 'text-[#e8dcc9] cursor-default'
                    : 'text-[#8c735c] hover:text-[#a24809] hover:bg-[#faf5ef]'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 h-2 bg-[#faf5ef] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#a24809] rounded-full"
                  animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-medium text-[#8c735c] whitespace-nowrap">
                {step + 1} / {QUESTIONS.length}
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: direction * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -32 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <h2 className="text-xl font-display font-bold text-[#a24809] mb-5">
                  {QUESTIONS[step].question}
                </h2>
                <div className="space-y-2.5">
                  {QUESTIONS[step].options.map((option, i) => {
                    const selected = answers[step] === i;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => selectOption(i)}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 border-2 ${
                          selected
                            ? 'bg-[#a24809] text-white border-[#a24809] shadow-md shadow-[#a24809]/20'
                            : 'bg-[#faf5ef] text-[#604f42] border-transparent hover:border-[#e8aa80] hover:text-[#a24809]'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {phase === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 flex flex-col items-center text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6"
            >
              <ScanSearch className="w-8 h-8 text-[#a24809]" />
            </motion.div>
            <p className="text-[#8c735c] font-medium">Reading your answers…</p>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="py-4 flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-5">
              <ScanSearch className="w-8 h-8 text-[#a24809]" />
            </div>
            <p className="text-sm text-[#8c735c] mb-1">Your skin type is</p>
            <h2 className="text-4xl font-display font-extrabold text-[#a24809] mb-4">{result}</h2>
            <p className="text-sm text-[#8c735c] max-w-sm mb-8">{RESULT_INFO[result]}</p>
            <button
              type="button"
              onClick={() => onComplete(result)}
              className="w-full py-3.5 rounded-2xl bg-[#a24809] text-white font-semibold hover:bg-[#8a3a07] transition-colors duration-300 shadow-md shadow-[#a24809]/20"
            >
              Use this result
            </button>
            <button
              type="button"
              onClick={retake}
              className="mt-3 text-sm font-medium text-[#8c735c] hover:text-[#a24809] transition-colors"
            >
              Retake the quiz
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
