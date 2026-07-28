import { KeyboardEvent, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { COMMON_ALLERGENS } from '../lib/profileOptions';

/**
 * Tag-style input for a user's known allergens. Users can pick common ones or
 * type their own; each becomes a chip. Stored as a string[] on the profile and
 * matched (by name) against a product's ingredients during analysis.
 */
export default function AllergyInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const item = raw.trim();
    if (!item) return;
    // case-insensitive de-dupe
    if (value.some((v) => v.toLowerCase() === item.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, item]);
    setDraft('');
  };

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const suggestions = COMMON_ALLERGENS.filter(
    (a) => !value.some((v) => v.toLowerCase() === a.toLowerCase())
  );

  return (
    <div>
      {/* Selected chips + text input, all in one bordered box */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#faf5ef] border-2 border-transparent focus-within:border-[#e8aa80] focus-within:bg-white transition-all duration-200">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-[#ffe4c9]/70 text-[#a24809] text-sm font-medium"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              aria-label={`Remove ${item}`}
              className="text-[#a24809]/60 hover:text-[#a24809]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? 'Type an ingredient and press Enter' : 'Add another…'}
          aria-label="Add an allergen"
          className="flex-1 min-w-[8rem] bg-transparent py-1.5 px-2 text-sm text-[#604f42] placeholder:text-[#c4b39c] focus:outline-none"
        />
      </div>

      {/* Quick-add common allergens */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#faf5ef] text-[#8c735c] border border-[#e8aa80]/40 hover:border-[#a24809] hover:text-[#a24809] transition-colors"
            >
              <Plus className="w-3 h-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
