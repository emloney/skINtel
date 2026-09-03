import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Camera, ChevronDown, Layers, Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';
import { analyzeProduct, askAnalysis, AnalysisResult, ChatMessage, UserProfile } from '../lib/analysis';
import { analyzeRoutine, RoutineResult } from '../lib/interactions';
import { lookupBarcode, linkBarcodeToProduct, ExternalMatch } from '../lib/barcode';
import AnalysisPanel from '../components/AnalysisPanel';
import RoutinePanel from '../components/RoutinePanel';
import BarcodeScanner from '../components/BarcodeScanner';
import ExternalProductCard from '../components/ExternalProductCard';
import KidsIcon from '../components/KidsIcon';

interface Product {
  id: number;
  brand: string;
  product_name: string;
  product_type: string | null;
  ingredients_parsed: string[] | null;
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

  const [profile, setProfile] = useState<UserProfile>({});
  const [teenMode, setTeenMode] = useState(false);
  const [teenInfoOpen, setTeenInfoOpen] = useState(false);
  // Barcode scanning
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLooking, setScanLooking] = useState(false);
  const [externalMatch, setExternalMatch] = useState<ExternalMatch | null>(null);
  // Set when a scan matched nothing — the next product the user picks gets
  // this barcode attached, so future scans find it.
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [routine, setRoutine] = useState<RoutineResult | null>(null);
  const [showRoutine, setShowRoutine] = useState(false);
  // Per-shelf-item analysis state, keyed by user_products row id.
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({});
  // AI layer (bonus — never blocks the deterministic result).
  // conversation[itemId][0] is the opening summary; later entries are chat turns.
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiFailed, setAiFailed] = useState<Record<string, boolean>>({});
  const [chatSending, setChatSending] = useState<Record<string, boolean>>({});
  const [chatErrored, setChatErrored] = useState<Record<string, boolean>>({});

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
        .select('id, product:indian_products(id, brand, product_name, product_type, ingredients_parsed)')
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

  // ── User profile (for personalizing the analysis) ──
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('skin_type, skin_concerns, allergies, is_pregnant, age_range')
        .eq('id', user.id)
        .maybeSingle();
      if (active && data) {
        setProfile({
          skinType: data.skin_type,
          skinConcerns: data.skin_concerns,
          allergies: data.allergies,
          isPregnant: data.is_pregnant,
        });
        // Default teen/tween mode on for under-18 profiles; still user-toggleable.
        if (data.age_range === 'Under 18') setTeenMode(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // ── Analyze a shelf product ──
  const analyzeItem = async (item: ShelfItem) => {
    // Already analyzed → just toggle the panel.
    if (analyses[item.id]) {
      setOpenPanels((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
      return;
    }
    const ingredients = item.product.ingredients_parsed ?? [];
    if (ingredients.length === 0) {
      setNotice(`We don't have an ingredient list for ${displayName(item.product)} yet.`);
      return;
    }
    setAnalyzing(item.id);
    setNotice(null);
    try {
      const result = await analyzeProduct(ingredients, { ...profile, youngSkin: teenMode });
      setAnalyses((prev) => ({ ...prev, [item.id]: result }));
      setOpenPanels((prev) => ({ ...prev, [item.id]: true }));

      // Best-effort history write — never block the UI on it.
      if (user) {
        supabase
          .from('scan_history')
          .insert({
            user_id: user.id,
            product_name: displayName(item.product),
            safety_score: result.score,
            flags_found: result.flags.length + result.banned.length,
          })
          .then(({ error }) => {
            if (error) console.warn('scan_history write skipped:', error.message);
          });
      }

      // AI opening summary — bonus layer. If the Edge Function isn't deployed
      // or the API is down, we just hide it; the findings above still show.
      setAiFailed((prev) => ({ ...prev, [item.id]: false }));
      setAiLoading((prev) => ({ ...prev, [item.id]: true }));
      askAnalysis({ productName: displayName(item.product), result, profile, messages: [] })
        .then((summary) =>
          setConversations((prev) => ({ ...prev, [item.id]: [{ role: 'assistant', content: summary }] }))
        )
        .catch((err) => {
          console.warn('AI summary unavailable:', errorMessage(err, 'unknown'));
          setAiFailed((prev) => ({ ...prev, [item.id]: true }));
        })
        .finally(() => setAiLoading((prev) => ({ ...prev, [item.id]: false })));
    } catch (err: unknown) {
      setNotice(friendlyError(errorMessage(err, 'Could not analyze this product.')));
    } finally {
      setAnalyzing(null);
    }
  };

  // ── Send a follow-up chat question about an analyzed product ──
  const sendChatMessage = (item: ShelfItem, text: string) => {
    const result = analyses[item.id];
    const existing = conversations[item.id];
    if (!result || !existing) return;

    const next: ChatMessage[] = [...existing, { role: 'user', content: text }];
    setConversations((prev) => ({ ...prev, [item.id]: next }));
    setChatErrored((prev) => ({ ...prev, [item.id]: false }));
    setChatSending((prev) => ({ ...prev, [item.id]: true }));

    askAnalysis({ productName: displayName(item.product), result, profile, messages: next })
      .then((reply) =>
        setConversations((prev) => ({
          ...prev,
          [item.id]: [...next, { role: 'assistant', content: reply }],
        }))
      )
      .catch((err) => {
        console.warn('Chat reply unavailable:', errorMessage(err, 'unknown'));
        setChatErrored((prev) => ({ ...prev, [item.id]: true }));
      })
      .finally(() => setChatSending((prev) => ({ ...prev, [item.id]: false })));
  };

  // ── Barcode scan ──
  const handleScan = async (barcode: string) => {
    setScannerOpen(false);
    setScanLooking(true);
    setNotice(null);
    setExternalMatch(null);
    try {
      const result = await lookupBarcode(barcode);

      if (result.source === 'catalog') {
        setPendingBarcode(null);
        await addToShelf({
          id: result.id,
          brand: result.brand,
          product_name: result.product_name,
          product_type: result.product_type,
          ingredients_parsed: result.ingredients_parsed,
        });
        setNotice(`Found ${displayName(result as unknown as Product)} — added to your shelf.`);
      } else if (result.source === 'openbeautyfacts') {
        setPendingBarcode(null);
        setExternalMatch(result);
      } else {
        // Nothing anywhere — let the user point us at the right product.
        setPendingBarcode(result.barcode);
        setNotice(
          `We don't know barcode ${result.barcode} yet. Search for the product below and we'll remember it next time.`
        );
        inputRef.current?.focus();
      }
    } catch (err: unknown) {
      setNotice(errorMessage(err, 'Could not look up that barcode.'));
    } finally {
      setScanLooking(false);
    }
  };

  const runRoutineCheck = () => setShowRoutine((prev) => !prev);

  // Always keep the routine result current so the button can show a count —
  // `showRoutine` only controls whether the panel is expanded.
  useEffect(() => {
    const products = shelf
      .map((item) => ({
        name: displayName(item.product),
        ingredients: item.product.ingredients_parsed ?? [],
      }))
      .filter((p) => p.ingredients.length > 0);
    setRoutine(products.length >= 2 ? analyzeRoutine(products) : null);
  }, [shelf]);

  // A serious conflict shouldn't need discovering — surface it automatically.
  const autoShownRef = useRef(false);
  useEffect(() => {
    if (routine?.highestSeverity === 'high' && !autoShownRef.current) {
      autoShownRef.current = true;
      setShowRoutine(true);
    }
    if (!routine || routine.highestSeverity !== 'high') {
      autoShownRef.current = false;
    }
  }, [routine]);

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
          .select('id, brand, product_name, product_type, ingredients_parsed')
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

      // A scan came up empty and the user has now identified the product —
      // attach the barcode so the next scan finds it straight away.
      if (pendingBarcode && user) {
        const code = pendingBarcode;
        setPendingBarcode(null);
        try {
          await linkBarcodeToProduct(product.id, code, user.id);
          setNotice(`Thanks — barcode ${code} is now linked to ${displayName(product)}.`);
        } catch (linkErr: unknown) {
          console.warn('barcode link failed:', errorMessage(linkErr, 'unknown'));
        }
      }
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
            Scan or search a product to see what's really in it.
          </p>
        </div>

        {/* Teen-safe mode (auto-on for under-18 profiles) — kept to one line;
            the explanation is there for anyone who wants it, not by default. */}
        {teenMode && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setTeenInfoOpen((o) => !o)}
              aria-expanded={teenInfoOpen}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#ffe4c9]/60 border border-[#e8aa80]/50 hover:border-[#a24809]/50 transition-colors"
            >
              <KidsIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold text-[#a24809]">Teen-safe mode is on</span>
              <ChevronDown
                className={`w-4 h-4 text-[#a24809]/60 ml-auto shrink-0 transition-transform duration-200 ${
                  teenInfoOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {teenInfoOpen && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden text-xs text-[#8c735c] leading-relaxed px-4 pt-2"
                >
                  We flag ingredients better saved for older skin — anti-aging retinoids, strong
                  acids, and heavy fragrance. A gentle cleanser, moisturiser and sunscreen are all
                  young skin really needs.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Scan ── */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={scanLooking}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition-colors duration-300 ${
              scanLooking
                ? 'bg-[#faf5ef] text-[#c4b39c] cursor-wait'
                : 'bg-[#a24809] text-white hover:bg-[#8a3a07] shadow-md shadow-[#a24809]/20'
            }`}
          >
            {scanLooking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Looking up that barcode…
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Scan a barcode
              </>
            )}
          </button>
          <p className="text-xs text-[#c4b39c] text-center mt-2">
            Or search by name below.
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

        {/* Scanned product found outside our catalog */}
        <AnimatePresence>
          {externalMatch && (
            <ExternalProductCard
              match={externalMatch}
              profile={{ ...profile, youngSkin: teenMode }}
              onDismiss={() => setExternalMatch(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Shelf ── */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-display font-bold text-xl text-[#a24809]">
              Your shelf{shelf.length > 0 ? ` (${shelf.length})` : ''}
            </h2>
            {shelf.length >= 2 && (
              <button
                type="button"
                onClick={runRoutineCheck}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  routine && routine.conflicts.length > 0
                    ? routine.highestSeverity === 'high'
                      ? 'bg-[#fbe6e3] text-[#a5281b] border-[#c0392b]/50 hover:border-[#c0392b]'
                      : 'bg-[#ffe4c9]/70 text-[#a24809] border-[#e8aa80] hover:border-[#a24809]'
                    : 'bg-[#faf5ef] text-[#a24809] border-[#e8aa80]/40 hover:border-[#a24809]'
                }`}
              >
                {routine && routine.conflicts.length > 0 ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <Layers className="w-3.5 h-3.5" />
                )}
                {showRoutine
                  ? 'Hide routine'
                  : routine && routine.conflicts.length > 0
                  ? `Check my routine (${routine.conflicts.length})`
                  : 'Check my routine'}
                {!showRoutine && routine && routine.conflicts.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#faf5ef]"
                    style={{
                      backgroundColor:
                        routine.highestSeverity === 'high' ? '#c0392b' : '#c87840',
                    }}
                  />
                )}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showRoutine && routine && <RoutinePanel result={routine} />}
          </AnimatePresence>

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
                    className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-[#e8aa80]/20"
                  >
                    <div className="flex items-center justify-between gap-4">
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
                        <button
                          type="button"
                          onClick={() => analyzeItem(item)}
                          disabled={analyzing === item.id}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                            analyzing === item.id
                              ? 'bg-[#faf5ef] text-[#c4b39c] cursor-wait'
                              : 'bg-[#a24809] text-white hover:bg-[#8a3a07]'
                          }`}
                        >
                          {analyzing === item.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Analyzing…
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              {analyses[item.id]
                                ? openPanels[item.id]
                                  ? 'Hide'
                                  : 'Results'
                                : 'Analyze'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromShelf(item)}
                          aria-label={`Remove ${displayName(item.product)}`}
                          className="p-2 rounded-full text-[#c4b39c] hover:text-[#a24809] hover:bg-[#faf5ef] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {analyses[item.id] && openPanels[item.id] && (
                        <AnalysisPanel
                          result={analyses[item.id]}
                          conversation={conversations[item.id]}
                          aiLoading={aiLoading[item.id]}
                          aiFailed={aiFailed[item.id]}
                          chatSending={chatSending[item.id]}
                          chatErrored={chatErrored[item.id]}
                          onSendMessage={(text) => sendChatMessage(item, text)}
                          brand={item.product.brand}
                          productName={displayName(item.product)}
                        />
                      )}
                    </AnimatePresence>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {scannerOpen && (
          <BarcodeScanner onDetected={handleScan} onClose={() => setScannerOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
