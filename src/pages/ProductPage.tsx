import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ShieldCheck, Info, ExternalLink } from 'lucide-react';
import Grainient from '../components/Grainient';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

type RiskLevel = 'safe' | 'caution' | 'toxic';

interface Ingredient {
  name: string;
  risk: RiskLevel;
  description: string;
}

// Mock product data — will be replaced by backend
const MOCK_PRODUCT_DB: Record<string, {
  name: string;
  brand: string;
  category: string;
  overallScore: number; // 0-100 safety score
  ingredients: Ingredient[];
}> = {
  '1': {
    name: 'CeraVe Moisturizing Cream',
    brand: 'CeraVe',
    category: 'Moisturizer',
    overallScore: 88,
    ingredients: [
      { name: 'Ceramide NP', risk: 'safe', description: 'Skin-identical lipid that restores the natural barrier.' },
      { name: 'Hyaluronic Acid', risk: 'safe', description: 'Powerful humectant that attracts and retains moisture.' },
      { name: 'Dimethicone', risk: 'safe', description: 'Silicone-based emollient providing smooth texture.' },
      { name: 'Cetearyl Alcohol', risk: 'safe', description: 'Fatty alcohol used as an emollient — not the drying kind.' },
      { name: 'Phenoxyethanol', risk: 'caution', description: 'Common preservative. Generally safe, but may irritate sensitive skin.' },
      { name: 'Petrolatum', risk: 'caution', description: 'Occlusive agent. Generally safe when refined, but comedogenic for some.' },
    ],
  },
  '2': {
    name: 'CeraVe Foaming Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    overallScore: 82,
    ingredients: [
      { name: 'Niacinamide', risk: 'safe', description: 'Vitamin B3 — reduces redness, minimizes pores.' },
      { name: 'Ceramide AP', risk: 'safe', description: 'Essential lipid that strengthens the skin barrier.' },
      { name: 'Sodium Lauroyl Sarcosinate', risk: 'safe', description: 'Gentle surfactant derived from amino acids.' },
      { name: 'Cocamidopropyl Betaine', risk: 'caution', description: 'Mild surfactant, but may cause contact dermatitis in rare cases.' },
      { name: 'Methylparaben', risk: 'toxic', description: 'Paraben preservative linked to endocrine disruption in studies.' },
    ],
  },
  '3': {
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Serum',
    overallScore: 92,
    ingredients: [
      { name: 'Niacinamide', risk: 'safe', description: 'Vitamin B3 — targets pores, oiliness, and uneven tone.' },
      { name: 'Zinc PCA', risk: 'safe', description: 'Mineral complex that regulates sebum production.' },
      { name: 'Pentylene Glycol', risk: 'safe', description: 'Hydrating solvent with mild preservative properties.' },
      { name: 'Glycerin', risk: 'safe', description: 'Classic humectant that keeps skin hydrated.' },
    ],
  },
  '4': {
    name: 'The Ordinary Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'Serum',
    overallScore: 95,
    ingredients: [
      { name: 'Sodium Hyaluronate', risk: 'safe', description: 'Low molecular weight HA for deeper skin hydration.' },
      { name: 'Panthenol', risk: 'safe', description: 'Provitamin B5 — soothes and repairs the skin.' },
      { name: 'Sodium Hyaluronate Crosspolymer', risk: 'safe', description: 'Cross-linked HA for sustained surface hydration.' },
    ],
  },
  '5': {
    name: 'La Roche-Posay Toleriane Double Repair',
    brand: 'La Roche-Posay',
    category: 'Moisturizer',
    overallScore: 85,
    ingredients: [
      { name: 'Ceramide NP', risk: 'safe', description: 'Restores and maintains the skin\'s natural barrier.' },
      { name: 'Niacinamide', risk: 'safe', description: 'Brightens and reduces inflammation.' },
      { name: 'Glycerin', risk: 'safe', description: 'Time-tested humectant for all skin types.' },
      { name: 'Dimethicone', risk: 'safe', description: 'Creates a smooth, silky feel on the skin.' },
      { name: 'Phenoxyethanol', risk: 'caution', description: 'Widely used preservative. Safe at regulated concentrations.' },
      { name: 'Propylparaben', risk: 'toxic', description: 'Paraben preservative with potential endocrine effects.' },
    ],
  },
  '6': {
    name: 'Neutrogena Hydro Boost Water Gel',
    brand: 'Neutrogena',
    category: 'Moisturizer',
    overallScore: 79,
    ingredients: [
      { name: 'Hyaluronic Acid', risk: 'safe', description: 'Superstar hydrator drawing moisture into skin.' },
      { name: 'Dimethicone', risk: 'safe', description: 'Silicone emollient providing a smooth finish.' },
      { name: 'Methylparaben', risk: 'toxic', description: 'Preservative flagged for potential hormonal disruption.' },
      { name: 'Fragrance', risk: 'toxic', description: 'Undisclosed blend — common cause of sensitization and irritation.' },
      { name: 'Ethylhexylglycerin', risk: 'caution', description: 'Mild preservative booster. Low risk for most, but can irritate some.' },
    ],
  },
  '7': {
    name: 'Paula\'s Choice 2% BHA Liquid Exfoliant',
    brand: 'Paula\'s Choice',
    category: 'Exfoliant',
    overallScore: 90,
    ingredients: [
      { name: 'Salicylic Acid', risk: 'safe', description: 'BHA that penetrates pores to clear congestion.' },
      { name: 'Green Tea Extract', risk: 'safe', description: 'Antioxidant that calms and protects.' },
      { name: 'Methylpropanediol', risk: 'safe', description: 'Solvent that enhances ingredient penetration.' },
      { name: 'Butylene Glycol', risk: 'caution', description: 'Common solvent — safe for most, but may irritate very sensitive skin.' },
    ],
  },
  '8': {
    name: 'Cetaphil Gentle Skin Cleanser',
    brand: 'Cetaphil',
    category: 'Cleanser',
    overallScore: 74,
    ingredients: [
      { name: 'Cetyl Alcohol', risk: 'safe', description: 'Fatty alcohol that provides emollient properties.' },
      { name: 'Sodium Lauryl Sulfate', risk: 'toxic', description: 'Harsh surfactant — can strip the skin and cause irritation.' },
      { name: 'Propylene Glycol', risk: 'caution', description: 'Humectant and solvent. May cause irritation in high concentrations.' },
      { name: 'Propylparaben', risk: 'toxic', description: 'Preservative with concerns around endocrine disruption.' },
    ],
  },
  '9': {
    name: 'Drunk Elephant Protini Polypeptide Cream',
    brand: 'Drunk Elephant',
    category: 'Moisturizer',
    overallScore: 91,
    ingredients: [
      { name: 'Signal Peptides', risk: 'safe', description: 'Amino acid chains that support skin firmness.' },
      { name: 'Pygmy Waterlily Stem Cell Extract', risk: 'safe', description: 'Botanical extract with antioxidant benefits.' },
      { name: 'Squalane', risk: 'safe', description: 'Plant-derived emollient that mimics skin\'s natural oils.' },
      { name: 'Sodium Hyaluronate', risk: 'safe', description: 'Hydrating form of hyaluronic acid.' },
      { name: 'Phenoxyethanol', risk: 'caution', description: 'Widely used preservative at safe concentrations.' },
    ],
  },
  '10': {
    name: 'Tatcha The Dewy Skin Cream',
    brand: 'Tatcha',
    category: 'Moisturizer',
    overallScore: 83,
    ingredients: [
      { name: 'Japanese Purple Rice', risk: 'safe', description: 'Rich in anthocyanins for antioxidant protection.' },
      { name: 'Hyaluronic Acid', risk: 'safe', description: 'Deep hydration by drawing moisture into skin.' },
      { name: 'Squalane', risk: 'safe', description: 'Lightweight, non-comedogenic moisturizer.' },
      { name: 'Fragrance', risk: 'toxic', description: 'Undisclosed fragrance blend — common allergen.' },
      { name: 'Phenoxyethanol', risk: 'caution', description: 'Standard preservative. Generally well-tolerated.' },
    ],
  },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  safe:    { label: 'Safe',    color: '#2d8a4e', bg: '#e6f5ec', border: '#a3dbb8', icon: ShieldCheck },
  caution: { label: 'Caution', color: '#b8860b', bg: '#fef9e7', border: '#f0d78c', icon: Info },
  toxic:   { label: 'Avoid',   color: '#c0392b', bg: '#fdecea', border: '#f5a8a1', icon: AlertTriangle },
};

function getScoreColor(score: number) {
  if (score >= 85) return '#2d8a4e';
  if (score >= 70) return '#b8860b';
  return '#c0392b';
}

function getScoreLabel(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  return 'Concerning';
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = id ? MOCK_PRODUCT_DB[id] : null;

  if (!product) {
    return (
      <div className="relative min-h-screen bg-[#faf5ef]">
        <header
          style={{ backgroundColor: '#F9F4EE', color: '#a24809' }}
          className="sticky top-0 z-[100] flex items-center justify-between px-6 py-3 shadow-sm border-b border-[#e8aa80]/40"
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SkinTel Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
            <span className="font-display font-bold text-xl tracking-tight cursor-pointer" style={{ color: '#a24809' }} onClick={() => navigate('/')}>
              SkinTel.
            </span>
          </div>
          <button onClick={() => navigate('/search')} style={{ color: '#a24809', borderColor: '#e8aa80' }} className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/60 backdrop-blur-sm font-medium text-sm hover:bg-[#ffe4c9] transition-all duration-200 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 bg-[#ffe4c9] rounded-full flex items-center justify-center mb-6">
            <Info className="w-9 h-9 text-[#a24809]" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[#a24809] mb-2">Product Not Found</h2>
          <p className="text-[#8c735c] max-w-md">We couldn't find this product. It may not be in our database yet.</p>
          <button onClick={() => navigate('/search')} className="mt-6 btn-primary px-8 py-3 text-sm">
            Search Again
          </button>
        </div>
      </div>
    );
  }

  const safeCount = product.ingredients.filter((i) => i.risk === 'safe').length;
  const cautionCount = product.ingredients.filter((i) => i.risk === 'caution').length;
  const toxicCount = product.ingredients.filter((i) => i.risk === 'toxic').length;

  return (
    <div className="relative min-h-screen bg-[#faf5ef]">
      {/* ─── Header ─── */}
      <header
        style={{ backgroundColor: '#F9F4EE', color: '#a24809' }}
        className="sticky top-0 z-[100] flex items-center justify-between px-6 py-3 shadow-sm border-b border-[#e8aa80]/40"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SkinTel Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
          <span className="font-display font-bold text-xl tracking-tight cursor-pointer" style={{ color: '#a24809' }} onClick={() => navigate('/')}>
            SkinTel.
          </span>
        </div>
        <button
          onClick={() => navigate('/search')}
          style={{ color: '#a24809', borderColor: '#e8aa80' }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/60 backdrop-blur-sm font-medium text-sm hover:bg-[#ffe4c9] transition-all duration-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>
      </header>

      {/* ─── Product Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Grainient
            color1="#e8aa80"
            color2="#a24809"
            color3="#c87840"
            timeSpeed={0.15}
            colorBalance={0.0}
            warpStrength={0.6}
            warpFrequency={4.0}
            warpSpeed={1.5}
            warpAmplitude={40.0}
            blendAngle={0.0}
            blendSoftness={0.05}
            rotationAmount={400.0}
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

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-20">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            {/* Breadcrumb */}
            <motion.div variants={fadeInUp} className="flex items-center gap-2 text-white/70 text-sm">
              <button onClick={() => navigate('/search')} className="hover:text-white transition-colors duration-200">Search</button>
              <span>/</span>
              <span className="text-white/90">{product.brand}</span>
            </motion.div>

            {/* Product Title */}
            <motion.h1 variants={fadeInUp} className="text-3xl md:text-5xl font-display font-extrabold text-white drop-shadow-lg leading-tight">
              {product.name}
            </motion.h1>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                {product.brand}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                {product.category}
              </span>
            </motion.div>

            {/* Safety Score Badge */}
            <motion.div variants={fadeInUp} className="flex items-center gap-5 pt-2">
              <div
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg"
                style={{ backgroundColor: getScoreColor(product.overallScore) }}
              >
                <span className="text-2xl font-extrabold text-white leading-none">{product.overallScore}</span>
                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">score</span>
              </div>
              <div>
                <p className="text-xl font-display font-bold text-white">{getScoreLabel(product.overallScore)}</p>
                <p className="text-white/75 text-sm">
                  {safeCount} safe · {cautionCount} caution · {toxicCount} avoid
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Ingredients Breakdown ─── */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          <motion.h2 variants={fadeInUp} className="text-2xl font-display font-bold text-[#a24809]">
            Ingredients Breakdown
          </motion.h2>

          {/* Summary Cards */}
          <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Safe', count: safeCount, config: RISK_CONFIG.safe },
              { label: 'Caution', count: cautionCount, config: RISK_CONFIG.caution },
              { label: 'Avoid', count: toxicCount, config: RISK_CONFIG.toxic },
            ].map(({ label, count, config }) => {
              const Icon = config.icon;
              return (
                <motion.div
                  key={label}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl p-5 text-center border-2 transition-all duration-300"
                  style={{ backgroundColor: config.bg, borderColor: config.border }}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: config.color }} />
                  <p className="text-2xl font-extrabold" style={{ color: config.color }}>{count}</p>
                  <p className="text-sm font-medium mt-1" style={{ color: config.color }}>{label}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Ingredient List */}
          <motion.div variants={stagger} className="space-y-3">
            {/* Show toxic first, then caution, then safe */}
            {[...product.ingredients]
              .sort((a, b) => {
                const order: Record<RiskLevel, number> = { toxic: 0, caution: 1, safe: 2 };
                return order[a.risk] - order[b.risk];
              })
              .map((ingredient, idx) => {
                const config = RISK_CONFIG[ingredient.risk];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={fadeInUp}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border-l-4 transition-all duration-300 hover:shadow-md"
                    style={{ borderLeftColor: config.color }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: config.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-display font-bold text-[#604f42]">{ingredient.name}</h4>
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-[#8c735c] leading-relaxed">{ingredient.description}</p>
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            variants={fadeInUp}
            className="mt-10 p-5 bg-[#ffe4c9]/40 rounded-2xl border border-[#e8aa80]/30 text-center"
          >
            <p className="text-sm text-[#8c735c]">
              <Info className="inline w-4 h-4 mr-1 -mt-0.5 text-[#a24809]" />
              This analysis is for informational purposes only. Consult a dermatologist for personalized advice.
            </p>
          </motion.div>
        </motion.div>
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
