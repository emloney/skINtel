import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';

interface Product {
  id: number;
  brand: string;
  product_name: string;
  product_type: string | null;
}

interface ShelfItem {
  id: string; // user_products row id
  product: Product;
}

const MIN_QUERY_LENGTH = 2;

// Catalog names often have the brand glued to the front ("HimalayaAnti-Wrinkle
// Cream") — show just the product part when that happens.
function displayName(product: Product) {
  const name = product.product_name.trim();
  const brand = product.brand.trim();
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    const stripped = name.slice(brand.length).trim();
    if (stripped) return stripped;
  }
  return name;
}

function displayType(type: string | null) {
  if (!type) return null;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [shelfError, setShelfError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const friendlyError = (message: string) =>
    message.includes('schema cache') || message.includes('does not exist')
      ? 'The shelf table is not set up yet — run supabase/user_products_table.sql in your Supabase SQL Editor.'
      : message;

  // ── Shelf ──
  const loadShelf = useCallback(async () => {
    if (!user) return;
    setShelfLoading(true);
    setShelfError(null);
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select('id, product:indian_products(id, brand, product_name, product_type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const items = (data ?? [])
        .map((row) => ({ id: row.id, product: row.product as unknown as Product }))
        .filter((row) => row.product);
      setShelf(items);
    } catch (err: unknown) {
      setShelfError(friendlyError(errorMessage(err, 'Could not load your shelf.')));
    } finally {
      setShelfLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadShelf();
  }, [loadShelf]);

  // ── Debounced search ──
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setDropdownOpen(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        // commas and parens are PostgREST filter syntax — neutralize them
        const term = q.replace(/[,()]/g, ' ').trim();
        const { data, error } = await supabase
          .from('indian_products')
          .select('id, brand, product_name, product_type')
          .or(`product_name.ilike.%${term}%,brand.ilike.%${term}%`)
          .order('brand')
          .limit(8);
        if (error) throw error;
        setSearchError(null);
        setResults(data ?? []);
        setDropdownOpen(true);
        setHighlighted(-1);
      } catch (err: unknown) {
        setSearchError(friendlyError(errorMessage(err, 'Search failed.')));
        setResults([]);
        setDropdownOpen(true);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addToShelf = async (product: Product) => {
    if (!user) return;
    setDropdownOpen(false);
    setQuery('');
    setNotice(null);
    inputRef.current?.focus();

    if (shelf.some((item) => item.product.id === product.id)) {
      setNotice(`${displayName(product)} is already on your shelf.`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_products')
        .insert({ user_id: user.id, product_id: product.id })
        .select('id')
        .single();
      if (error) throw error;
      setShelf((prev) => [{ id: data.id, product }, ...prev]);
    } catch (err: unknown) {
      const message = errorMessage(err, 'Could not add the product.');
      setNotice(
        message.includes('duplicate')
          ? `${displayName(product)} is already on your shelf.`
          : friendlyError(message)
      );
    }
  };

  const removeFromShelf = async (item: ShelfItem) => {
    setNotice(null);
    const previous = shelf;
    setShelf((prev) => prev.filter((s) => s.id !== item.id));
    const { error } = await supabase.from('user_products').delete().eq('id', item.id);
    if (error) {
      setShelf(previous);
      setNotice(friendlyError(error.message));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownOpen || results.length === 0) {
      if (e.key === 'Escape') setDropdownOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? results.length - 1 : h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) addToShelf(results[highlighted]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
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
          onClick={() => navigate('/landing')}
          className="inline-flex items-center gap-2 text-[#8c735c] hover:text-[#a24809] transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6">
            <Search className="w-8 h-8 text-[#a24809]" />
          </div>
          <h1 className="text-4xl font-display font-bold text-[#a24809] mb-3">Check your products</h1>
          <p className="text-[#8c735c] text-lg max-w-md mx-auto">
            Search for a product and add it to your shelf. We'll analyze the ingredients for your
            skin, one product at a time.
          </p>
        </div>

        {/* ── Search ── */}
        <div ref={searchBoxRef} className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c4b39c] pointer-events-none" />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a24809] animate-spin" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0 && query.trim().length >= MIN_QUERY_LENGTH)
                  setDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Try 'Himalaya', 'Lakme', 'moisturiser'…"
              autoFocus
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-label="Search products"
              className="w-full py-4 pl-12 pr-12 rounded-2xl bg-white border-2 border-[#e8aa80]/30 text-[#604f42] placeholder:text-[#c4b39c] focus:outline-none focus:border-[#e8aa80] shadow-lg shadow-[#a24809]/5 transition-all duration-300"
            />
          </div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                role="listbox"
                className="absolute left-0 right-0 top-full mt-2 z-20 bg-white rounded-2xl shadow-xl border border-[#e8aa80]/30 overflow-hidden max-h-80 overflow-y-auto"
              >
                {searchError && (
                  <li className="px-4 py-3 text-sm text-red-700 bg-red-50">{searchError}</li>
                )}
                {!searchError && results.length === 0 && !searching && (
                  <li className="px-4 py-4 text-sm text-[#8c735c] text-center">
                    No matches for "{query.trim()}" — we're adding new products all the time.
                  </li>
                )}
                {!searchError &&
                  results.map((product, i) => (
                    <li key={product.id} role="option" aria-selected={i === highlighted}>
                      <button
                        type="button"
                        onClick={() => addToShelf(product)}
                        onMouseEnter={() => setHighlighted(i)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                          i === highlighted ? 'bg-[#ffe4c9]/50' : 'bg-white'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#604f42] truncate">
                            {displayName(product)}
                          </span>
                          <span className="block text-xs text-[#8c735c]">{product.brand}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          {product.product_type && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#faf5ef] text-[#8c735c] text-xs font-medium">
                              {displayType(product.product_type)}
                            </span>
                          )}
                          <Plus className="w-4 h-4 text-[#a24809]" />
                        </span>
                      </button>
                    </li>
                  ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {notice && (
          <div className="mb-6 p-3 rounded-xl bg-[#ffe4c9]/60 border border-[#e8aa80] text-[#a24809] text-sm">
            {notice}
          </div>
        )}

        {/* ── Shelf ── */}
        <div className="mt-10">
          <h2 className="font-display font-bold text-xl text-[#a24809] mb-4">
            Your shelf{shelf.length > 0 ? ` (${shelf.length})` : ''}
          </h2>

          {shelfLoading && (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#a24809]" />
            </div>
          )}

          {!shelfLoading && shelfError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {shelfError}
            </div>
          )}

          {!shelfLoading && !shelfError && shelf.length === 0 && (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#e8aa80]/20">
              <p className="text-[#8c735c]">
                Nothing here yet — search above to add your first product.
              </p>
            </div>
          )}

          {!shelfLoading && !shelfError && shelf.length > 0 && (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {shelf.map((item) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-[#e8aa80]/20"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#604f42] truncate">
                        {displayName(item.product)}
                      </p>
                      <p className="text-sm text-[#8c735c]">
                        {item.product.brand}
                        {item.product.product_type
                          ? ` · ${displayType(item.product.product_type)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf5ef] text-[#c4b39c] text-xs font-medium select-none">
                        <Sparkles className="w-3.5 h-3.5" />
                        Analysis coming soon
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromShelf(item)}
                        aria-label={`Remove ${displayName(item.product)}`}
                        className="p-2 rounded-full text-[#c4b39c] hover:text-[#a24809] hover:bg-[#faf5ef] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
