import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Sparkles, X, Clock, TrendingUp } from 'lucide-react';
import Grainient from '../components/Grainient';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// Placeholder mock data — will be replaced with backend search
const MOCK_PRODUCTS = [
  { id: '1', name: 'CeraVe Moisturizing Cream', brand: 'CeraVe', category: 'Moisturizer' },
  { id: '2', name: 'CeraVe Foaming Facial Cleanser', brand: 'CeraVe', category: 'Cleanser' },
  { id: '3', name: 'The Ordinary Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', category: 'Serum' },
  { id: '4', name: 'The Ordinary Hyaluronic Acid 2% + B5', brand: 'The Ordinary', category: 'Serum' },
  { id: '5', name: 'La Roche-Posay Toleriane Double Repair', brand: 'La Roche-Posay', category: 'Moisturizer' },
  { id: '6', name: 'Neutrogena Hydro Boost Water Gel', brand: 'Neutrogena', category: 'Moisturizer' },
  { id: '7', name: 'Paula\'s Choice 2% BHA Liquid Exfoliant', brand: 'Paula\'s Choice', category: 'Exfoliant' },
  { id: '8', name: 'Cetaphil Gentle Skin Cleanser', brand: 'Cetaphil', category: 'Cleanser' },
  { id: '9', name: 'Drunk Elephant Protini Polypeptide Cream', brand: 'Drunk Elephant', category: 'Moisturizer' },
  { id: '10', name: 'Tatcha The Dewy Skin Cream', brand: 'Tatcha', category: 'Moisturizer' },
];

const TRENDING = ['CeraVe', 'The Ordinary', 'Retinol', 'Sunscreen SPF 50'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the search input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  const results = query.trim().length > 0
    ? MOCK_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showResults = query.trim().length > 0;

  return (
    <div className="relative min-h-screen bg-[#faf5ef]">
      {/* ─── Header (identical to HomePage) ─── */}
      <header
        style={{ backgroundColor: '#F9F4EE', color: '#a24809' }}
        className="sticky top-0 z-[100] flex items-center justify-between px-6 py-3 shadow-sm border-b border-[#e8aa80]/40"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SkinTel Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
          <span
            className="font-display font-bold text-xl tracking-tight cursor-pointer"
            style={{ color: '#a24809' }}
            onClick={() => navigate('/')}
          >
            SkinTel.
          </span>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{ color: '#a24809', borderColor: '#e8aa80' }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/60 backdrop-blur-sm font-medium text-sm hover:bg-[#ffe4c9] transition-all duration-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      {/* ─── Hero / Search Area ─── */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <Grainient
            color1="#e8aa80"
            color2="#a24809"
            color3="#c87840"
            timeSpeed={0.25}
            colorBalance={0.0}
            warpStrength={1.0}
            warpFrequency={5.0}
            warpSpeed={2.0}
            warpAmplitude={50.0}
            blendAngle={0.0}
            blendSoftness={0.05}
            rotationAmount={500.0}
            noiseScale={2.0}
            grainAmount={0.04}
            grainScale={2.0}
            grainAnimated={false}
            contrast={1.5}
            gamma={1.0}
            saturation={1.0}
            centerX={0.0}
            centerY={0.0}
            zoom={0.9}
          />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            {/* Title */}
            <motion.div variants={fadeInUp} className="text-center">
              <h1 className="text-4xl md:text-5xl font-display font-extrabold leading-tight drop-shadow-lg text-glare">
                Find Your Product
              </h1>
              <p className="mt-3 text-lg text-white/85 max-w-lg mx-auto">
                Search any skincare product and discover what's really inside.
              </p>
            </motion.div>

            {/* ─── Search Input ─── */}
            <motion.div variants={fadeInUp} className="relative">
              <div
                className={`
                  relative flex items-center
                  bg-white/95 backdrop-blur-xl rounded-2xl
                  shadow-xl shadow-black/10
                  border-2 transition-all duration-300
                  ${isFocused ? 'border-[#a24809] shadow-[#a24809]/15' : 'border-white/60'}
                `}
              >
                <Search className="absolute left-5 w-6 h-6 text-[#c4b39c] pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g. CeraVe Moisturizing Cream…"
                  className="
                    w-full py-5 pl-14 pr-14
                    text-lg md:text-xl text-[#604f42]
                    placeholder:text-[#c4b39c]
                    bg-transparent rounded-2xl
                    focus:outline-none
                    font-medium
                  "
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-5 p-1 rounded-full hover:bg-[#ffe4c9] transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-[#a24809]" />
                  </button>
                )}
              </div>

              {/* Floating helper text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-3 text-center text-sm text-white/70"
              >
                <Sparkles className="inline w-4 h-4 mr-1 -mt-0.5" />
                Search by product name or brand
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Results / Empty State ─── */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="results"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={stagger}
              className="space-y-3"
            >
              <motion.p variants={fadeInUp} className="text-sm font-medium text-[#8c735c] mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </motion.p>

              {results.length > 0 ? (
                results.map((product) => (
                  <motion.button
                    key={product.id}
                    variants={fadeInUp}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="
                      w-full text-left flex items-center gap-4
                      bg-white rounded-2xl p-5
                      shadow-md shadow-black/5
                      border-2 border-transparent hover:border-[#e8aa80]
                      transition-all duration-300 group cursor-pointer
                    "
                  >
                    {/* Product icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#ffe4c9] flex items-center justify-center group-hover:bg-[#a24809] transition-colors duration-300">
                      <Search className="w-5 h-5 text-[#a24809] group-hover:text-white transition-colors duration-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-[#604f42] text-lg truncate group-hover:text-[#a24809] transition-colors duration-200">
                        {highlightMatch(product.name, query)}
                      </h3>
                      <p className="text-sm text-[#8c735c]">{product.brand} · {product.category}</p>
                    </div>

                    <div className="flex-shrink-0 text-[#c4b39c] group-hover:text-[#a24809] transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                ))
              ) : (
                <motion.div
                  variants={fadeInUp}
                  className="text-center py-16"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-[#ffe4c9] rounded-full mb-6">
                    <Search className="w-9 h-9 text-[#a24809]" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#a24809] mb-2">No products found</h3>
                  <p className="text-[#8c735c] max-w-md mx-auto">
                    We couldn't find anything matching "<span className="font-semibold">{query}</span>". Try a different name or brand.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="suggestions"
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-8"
            >
              {/* Trending Searches */}
              <motion.div variants={fadeInUp}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#a24809] uppercase tracking-wider mb-4">
                  <TrendingUp className="w-4 h-4" />
                  Trending Searches
                </h3>
                <div className="flex flex-wrap gap-3">
                  {TRENDING.map((term) => (
                    <motion.button
                      key={term}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setQuery(term)}
                      className="
                        px-5 py-2.5 rounded-full
                        bg-white border-2 border-[#e8aa80]/40
                        text-[#604f42] font-medium text-sm
                        hover:border-[#a24809] hover:bg-[#ffe4c9]
                        transition-all duration-300
                        shadow-sm
                      "
                    >
                      {term}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Recent Products (placeholder for future) */}
              <motion.div variants={fadeInUp}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#a24809] uppercase tracking-wider mb-4">
                  <Clock className="w-4 h-4" />
                  Popular Products
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                    <motion.button
                      key={product.id}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="
                        flex items-center gap-3 p-4
                        bg-white rounded-2xl border-2 border-transparent
                        hover:border-[#e8aa80] shadow-sm
                        transition-all duration-300 text-left group
                      "
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#ffe4c9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#a24809] transition-colors duration-300">
                        <Sparkles className="w-5 h-5 text-[#a24809] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-[#604f42] text-sm truncate group-hover:text-[#a24809] transition-colors duration-200">{product.name}</p>
                        <p className="text-xs text-[#8c735c]">{product.brand}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#f5efe6] text-[#8c735c] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#c4b39c]">
          <p>2026 SkinTel. Your skincare's new best friend.</p>
        </div>
      </footer>
    </div>
  );
}

/** Highlights matching portion of text in amber */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#a24809] font-extrabold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
