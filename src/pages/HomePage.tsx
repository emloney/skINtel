import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Grainient from '../components/Grainient';
import GradualBlur from '../components/GradualBlur';
import ProfileMenu from '../components/ProfileMenu';
import IngredientChecker from '../components/IngredientChecker';
import AnalysisPreview from '../components/AnalysisPreview';
import KidsIcon from '../components/KidsIcon';
import { getStoredTeenMode, setStoredTeenMode } from '../lib/teenMode';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.15 } },
};

function Hero({ name, isTeen }: { name: string; isTeen: boolean }) {
  const navigate = useNavigate();
  // Real figures from the database, so the page never overstates what we cover.
  const [stats, setStats] = useState<{ products: number; ingredients: number } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [products, harmful, ayurvedic] = await Promise.all([
        supabase.from('indian_products').select('*', { count: 'exact', head: true }),
        supabase.from('harmful_ingredients').select('*', { count: 'exact', head: true }),
        supabase.from('ayurvedic_ingredients').select('*', { count: 'exact', head: true }),
      ]);
      if (!active) return;
      setStats({
        products: products.count ?? 0,
        ingredients: (harmful.count ?? 0) + (ayurvedic.count ?? 0),
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  const scrollToHowItWorks = () =>
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Grainient
          color1="#f0b98d"
          color2="#e3944f"
          color3="#eaa870"
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
          contrast={1.15}
          gamma={1.0}
          saturation={0.8}
          centerX={0.0}
          centerY={0.0}
          zoom={0.9}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          {name && (
            <motion.p
              variants={fadeInUp}
              className="text-white/90 text-lg md:text-xl font-medium drop-shadow"
            >
              Welcome back, {name}
            </motion.p>
          )}

          {isTeen && (
            <motion.div variants={fadeInUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium">
                <KidsIcon className="w-5 h-5" />
                Teen-safe mode is on
              </span>
            </motion.div>
          )}

          <motion.div variants={fadeInUp} className="flex justify-center">
            <h1
              className={`leading-[1.1] drop-shadow-lg text-glare ${
                isTeen
                  ? 'font-round font-extrabold text-5xl md:text-7xl'
                  : 'font-serif font-light italic text-6xl md:text-8xl tracking-tight'
              }`}
            >
              Is your skincare
              <span className="block mt-1 leading-[1.05]">actually safe?</span>
            </h1>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            Scan any product label and get instant, science-backed insights on what's really in your skincare. No chemistry degree required.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/products')}
              className="btn-primary text-lg px-10 py-4"
            >
              Check My Products
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToHowItWorks}
              className="btn-secondary text-sm"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Try it before going anywhere */}
          <motion.div variants={fadeInUp} className="pt-6">
            <p className="text-white/80 text-sm mb-3">Or check a single ingredient right now:</p>
            <IngredientChecker />
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-8 text-white/80">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffe4c9]" />
              <span className="text-sm">Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffe4c9]" />
              <span className="text-sm">
                {stats ? `${stats.products} Indian products` : 'Indian products'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffe4c9]" />
              <span className="text-sm">
                {stats ? `${stats.ingredients} ingredients tracked` : 'Science-backed'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: '/icons/scan.png',
      title: 'Scan or Type',
      description: "Snap a photo of the ingredient list or paste the text. We'll take it from there, pretty packaging won't fool us.",
    },
    {
      number: '02',
      icon: '/icons/analyze.png',
      title: 'Analyze',
      description: "Our algorithm cross-references with dermatological databases. Think of it as having a tiny scientist in your pocket.",
    },
    {
      number: '03',
      icon: '/icons/results.png',
      title: 'Get Results',
      description: "Clear, color-coded ratings show you exactly what's safe and what to avoid. No confusing jargon, promise.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#faf5ef]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-serif italic font-light text-[#a24809] mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-[#8c735c] max-w-2xl mx-auto">
            Three simple steps to skincare enlightenment
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => {
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="relative bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-[#e8aa80] transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6">
                  <img src={step.icon} alt="" aria-hidden="true" className="w-10 h-10 object-contain" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-display font-extrabold text-[#e8aa80]/50">
                  {step.number}
                </div>
                <h3 className="text-2xl font-display font-bold text-[#a24809] mb-3">{step.title}</h3>
                <p className="text-[#8c735c] leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[#faf5ef]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-2xl mx-auto px-6 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-serif italic font-light text-[#a24809] mb-4">
          Ready to check your shelf?
        </h2>
        <p className="text-[#8c735c] text-lg mb-8">
          Add the products you already use and see what's really in them.
        </p>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/products')}
          className="px-10 py-4 rounded-full bg-[#a24809] text-white font-semibold text-lg shadow-lg shadow-[#a24809]/25 hover:bg-[#8a3a07] transition-colors duration-300"
        >
          Check My Products
        </motion.button>
      </motion.div>
    </section>
  );
}

function Footer() {
  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ];

  return (
    <footer className="bg-[#f5efe6] text-[#8c735c] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SkinTel Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
            <span className="font-display font-bold text-xl text-[#a24809]">SkinTel.</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#a24809] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="text-sm text-[#c4b39c]">
            Made with care for your skin
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#e8aa80]/30 text-center text-sm text-[#c4b39c]">
          <p>2026 SkinTel. Your skincare's new best friend. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [name, setName] = useState('');
  // Seeded from the remembered value so the theme doesn't flash, then corrected
  // by the profile — which is the source of truth.
  const [isTeen, setIsTeen] = useState(getStoredTeenMode);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('users')
      .select('name, age_range')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        if (data.name) setName(data.name as string);
        const teen = data.age_range === 'Under 18';
        setIsTeen(teen);
        setStoredTeenMode(teen); // so the splash themes itself next visit
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = () => {
    signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className={`relative min-h-screen bg-[#faf5ef] ${isTeen ? 'teen-theme' : ''}`}>
      {/* Header */}
      <header
        style={{ backgroundColor: '#F9F4EE', color: '#a24809' }}
        className="sticky top-0 z-[100] flex items-center justify-between px-6 py-3 shadow-sm border-b border-[#e8aa80]/40"
      >
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <img
            src={isTeen ? '/kids-logo.png' : '/logo.png'}
            alt="SkinTel Logo"
            className={`w-10 h-10 object-contain ${isTeen ? '' : 'mix-blend-multiply'}`}
          />
          <span
            className={`text-xl ${isTeen ? 'font-round font-extrabold' : 'font-display font-bold tracking-tight'}`}
            style={{ color: '#a24809' }}
          >
            SkinTel.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ProfileMenu />
          <button
            onClick={handleLogout}
            style={{ color: '#a24809', borderColor: '#e8aa80' }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/60 backdrop-blur-sm font-medium text-sm hover:bg-[#ffe4c9] transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <Hero name={name} isTeen={isTeen} />
      <HowItWorks />
      <AnalysisPreview />
      <ClosingCTA />
      <Footer />

      <GradualBlur
        target="page"
        position="bottom"
        height="5rem"
        strength={1}
        divCount={5}
        curve="bezier"
        exponential={true}
        opacity={0.7}
      />
    </div>
  );
}
