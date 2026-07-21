import { useEffect, useRef, useState, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pencil, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';
import SkinTypeQuiz from './SkinTypeQuiz';
import {
  AGE_RANGES,
  GENDERS,
  SKIN_TYPES,
  HAIR_TYPES,
  SKIN_CONCERNS,
  type SkinConcern,
} from '../lib/profileOptions';

interface ProfileRow {
  name: string | null;
  email: string | null;
  age_range: string | null;
  gender: string | null;
  skin_type: string | null;
  hair_type: string | null;
  skin_concerns: string[] | null;
}

function Chip({
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
      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border-2 ${
        selected
          ? 'bg-[#a24809] text-white border-[#a24809]'
          : 'bg-[#faf5ef] text-[#8c735c] border-transparent hover:border-[#e8aa80] hover:text-[#a24809]'
      }`}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-[#c4b39c] font-medium whitespace-nowrap">{label}</span>
      <span className="text-sm text-[#604f42] font-medium text-right">{value || '—'}</span>
    </div>
  );
}

export default function ProfileMenu() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // edit form state
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [skinType, setSkinType] = useState('');
  const [hairType, setHairType] = useState('');
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const loadProfile = async () => {
    if (!user) {
      setLoadError('You need to be signed in to view your profile.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, age_range, gender, skin_type, hair_type, skin_concerns')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('No profile found.');
      setProfile(data);
    } catch (err: unknown) {
      setLoadError(errorMessage(err, 'Could not load your profile.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setEditing(false);
      loadProfile();
    }
  };

  const startEditing = () => {
    if (!profile) return;
    setName(profile.name ?? '');
    setAgeRange(profile.age_range ?? '');
    setGender(profile.gender ?? '');
    setSkinType(profile.skin_type ?? '');
    setHairType(profile.hair_type ?? '');
    setSkinConcerns(profile.skin_concerns ?? []);
    setSaveError(null);
    setEditing(true);
  };

  const toggleConcern = (concern: SkinConcern) => {
    setSkinConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updates = {
        name,
        age_range: ageRange,
        gender,
        skin_type: skinType,
        hair_type: hairType,
        skin_concerns: skinConcerns,
      };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      setProfile((prev) => ({ ...(prev ?? { email: user.email }), ...updates }) as ProfileRow);
      setEditing(false);
    } catch (err: unknown) {
      setSaveError(errorMessage(err, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Your profile"
        aria-expanded={open}
        className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border font-medium transition-all duration-300 shadow-sm ${
          open
            ? 'bg-[#ffe4c9]/90 border-[#a24809] text-[#a24809]'
            : 'bg-[#faf5ef]/80 border-[#e8aa80] text-[#a24809] hover:bg-[#ffe4c9]/90 hover:border-[#a24809]'
        }`}
      >
        <UserRound className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-3 w-80 max-h-[75vh] overflow-y-auto bg-white rounded-3xl shadow-xl border border-[#e8aa80]/30 p-6"
          >
            {loading && (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#a24809]" />
              </div>
            )}

            {!loading && loadError && (
              <div className="py-6 text-center">
                <p className="text-sm text-[#8c735c] mb-4">{loadError}</p>
                <button
                  type="button"
                  onClick={loadProfile}
                  className="text-sm font-medium text-[#a24809] hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !loadError && profile && !editing && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ffe4c9] shrink-0">
                    <UserRound className="w-6 h-6 text-[#a24809]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-[#a24809] truncate">
                      {profile.name || 'Your profile'}
                    </p>
                    <p className="text-xs text-[#8c735c] truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="border-t border-[#e8aa80]/20 pt-3 mb-4">
                  <DetailRow label="Age range" value={profile.age_range ?? ''} />
                  <DetailRow label="Gender" value={profile.gender ?? ''} />
                  <DetailRow label="Skin type" value={profile.skin_type ?? ''} />
                  <DetailRow label="Hair type" value={profile.hair_type ?? ''} />
                  <div className="py-1.5">
                    <span className="text-xs text-[#c4b39c] font-medium">Skin concerns</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {profile.skin_concerns && profile.skin_concerns.length > 0 ? (
                        profile.skin_concerns.map((c) => (
                          <span
                            key={c}
                            className="px-2.5 py-1 rounded-lg bg-[#ffe4c9]/60 text-[#a24809] text-xs font-medium"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#604f42]">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startEditing}
                  className="w-full py-2.5 rounded-2xl bg-[#a24809] text-white text-sm font-semibold hover:bg-[#8a3a07] transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit profile
                </button>
              </div>
            )}

            {!loading && !loadError && profile && editing && (
              <form onSubmit={handleSave} className="space-y-4">
                <p className="font-display font-bold text-[#a24809]">Edit profile</p>

                {saveError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {saveError}
                  </div>
                )}

                <div>
                  <label htmlFor="pm-name" className="block text-xs font-medium text-[#a24809] mb-1.5">
                    Name
                  </label>
                  <input
                    id="pm-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#faf5ef] border-2 border-transparent text-sm text-[#604f42] focus:outline-none focus:border-[#e8aa80] focus:bg-white transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="pm-age" className="block text-xs font-medium text-[#a24809] mb-1.5">
                    Age range
                  </label>
                  <select
                    id="pm-age"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#faf5ef] border-2 border-transparent text-sm text-[#604f42] focus:outline-none focus:border-[#e8aa80] focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {AGE_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pm-gender" className="block text-xs font-medium text-[#a24809] mb-1.5">
                    Gender
                  </label>
                  <select
                    id="pm-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#faf5ef] border-2 border-transparent text-sm text-[#604f42] focus:outline-none focus:border-[#e8aa80] focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#a24809] mb-1.5">Skin type</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SKIN_TYPES.map((t) => (
                      <Chip key={t} label={t} selected={skinType === t} onClick={() => setSkinType(t)} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="mt-2 text-xs font-medium text-[#a24809] underline decoration-[#e8aa80] decoration-2 underline-offset-2 hover:decoration-[#a24809] transition-colors"
                  >
                    Not sure? Take the quiz
                  </button>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#a24809] mb-1.5">Hair type</span>
                  <div className="flex flex-wrap gap-1.5">
                    {HAIR_TYPES.map((t) => (
                      <Chip key={t} label={t} selected={hairType === t} onClick={() => setHairType(t)} />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#a24809] mb-1.5">Skin concerns</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SKIN_CONCERNS.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        selected={skinConcerns.includes(c)}
                        onClick={() => toggleConcern(c)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving || !skinType || !hairType}
                    className={`flex-1 py-2.5 rounded-2xl bg-[#a24809] text-white text-sm font-semibold hover:bg-[#8a3a07] transition-colors duration-300 flex items-center justify-center gap-2 ${
                      saving || !skinType || !hairType ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-2xl bg-[#faf5ef] text-[#8c735c] text-sm font-medium hover:text-[#a24809] transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
