import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';
import SkinTypeQuiz from '../components/SkinTypeQuiz';
import AllergyInput from '../components/AllergyInput';
import {
  AGE_RANGES,
  GENDERS,
  SKIN_TYPES,
  HAIR_TYPES,
  SKIN_CONCERNS,
  type AgeRange,
  type Gender,
  type SkinType,
  type HairType,
  type SkinConcern,
} from '../lib/profileOptions';

function SelectButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 border-2 ${
        selected
          ? 'bg-[#a24809] text-white border-[#a24809] shadow-md shadow-[#a24809]/20'
          : 'bg-[#faf5ef] text-[#8c735c] border-transparent hover:border-[#e8aa80] hover:text-[#a24809]'
      }`}
    >
      {label}
    </button>
  );
}

function ConcernCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
        checked
          ? 'bg-[#ffe4c9]/60 border-[#e8aa80] text-[#a24809]'
          : 'bg-[#faf5ef] border-transparent hover:border-[#e8aa80]/50 text-[#8c735c]'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-[#a24809] rounded"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshProfileStatus, signOut } = useAuth();

  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRange | ''>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [skinType, setSkinType] = useState<SkinType | ''>('');
  const [hairType, setHairType] = useState<HairType | ''>('');
  const [skinConcerns, setSkinConcerns] = useState<SkinConcern[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const toggleConcern = (concern: SkinConcern) => {
    setSkinConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleBack = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('You must be signed in to complete onboarding.');

      // Use upsert so it works even if the trigger didn't create a row
      // (e.g. accounts created before the trigger was set up)
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name,
          age_range: ageRange,
          gender,
          skin_type: skinType,
          hair_type: hairType,
          skin_concerns: skinConcerns,
          allergies,
          is_pregnant: isPregnant,
          profile_completed: true,
        });

      if (upsertError) throw upsertError;

      await refreshProfileStatus();
      navigate('/landing');
    } catch (err: unknown) {
      setError(errorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-[#8c735c] hover:text-[#a24809] transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt="SkinTel"
            className="w-20 h-20 mx-auto mb-4 object-contain mix-blend-multiply"
          />
          <h1 className="text-4xl font-display font-bold text-[#a24809] mb-3">
            Tell us about your skin
          </h1>
          <p className="text-[#8c735c] text-lg max-w-md mx-auto">
            A few quick details so SkinTel can personalize your experience.
          </p>
        </div>

        <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-[#e8aa80]/20">
          <div className="absolute top-6 right-6 text-5xl font-display font-extrabold text-[#e8aa80]/40 select-none pointer-events-none">
            03
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="auth-label">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="auth-input"
                required
              />
            </div>

            <div>
              <label htmlFor="age-range" className="auth-label">
                Age range
              </label>
              <select
                id="age-range"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                className="auth-input appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>
                  Select your age range
                </option>
                {AGE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gender" className="auth-label">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="auth-input appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>
                  Select your gender
                </option>
                {GENDERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="auth-label">Skin type</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {SKIN_TYPES.map((type) => (
                  <SelectButton
                    key={type}
                    label={type}
                    selected={skinType === type}
                    onClick={() => setSkinType(type)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowQuiz(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#a24809] underline decoration-[#e8aa80] decoration-2 underline-offset-4 hover:decoration-[#a24809] transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Not sure? Take our 2-minute quiz
              </button>
            </div>

            <div>
              <span className="auth-label">Hair type</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {HAIR_TYPES.map((type) => (
                  <SelectButton
                    key={type}
                    label={type}
                    selected={hairType === type}
                    onClick={() => setHairType(type)}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="auth-label">Skin concerns</span>
              <p className="text-xs text-[#c4b39c] mb-3">Select all that apply</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {SKIN_CONCERNS.map((concern) => (
                  <ConcernCheckbox
                    key={concern}
                    label={concern}
                    checked={skinConcerns.includes(concern)}
                    onChange={() => toggleConcern(concern)}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="auth-label">Known allergies</span>
              <p className="text-xs text-[#c4b39c] mb-3">
                Ingredients you react to — we'll warn you if a product contains them. Optional.
              </p>
              <AllergyInput value={allergies} onChange={setAllergies} />
            </div>

            <div>
              <span className="auth-label">Pregnancy</span>
              <label className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 bg-[#faf5ef] border-transparent hover:border-[#e8aa80]/50">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="w-4 h-4 accent-[#a24809] rounded"
                />
                <span className="text-sm font-medium text-[#8c735c]">
                  I'm currently pregnant or breastfeeding
                </span>
              </label>
              <p className="text-xs text-[#c4b39c] mt-2">
                We'll flag ingredients often advised against during pregnancy.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting || !skinType || !hairType}
              whileHover={!isSubmitting ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className={`w-full py-3.5 rounded-2xl bg-[#a24809] text-white font-semibold text-base hover:bg-[#8a3a07] transition-colors duration-300 shadow-md shadow-[#a24809]/20 flex items-center justify-center gap-2 ${
                isSubmitting || !skinType || !hairType ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving your profile…
                </>
              ) : (
                'Complete Profile'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {showQuiz && (
        <SkinTypeQuiz
          onClose={() => setShowQuiz(false)}
          onComplete={(type) => {
            setSkinType(type);
            setShowQuiz(false);
          }}
        />
      )}
    </div>
  );
}
