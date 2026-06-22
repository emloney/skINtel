import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Microscope, Check, LogOut } from 'lucide-react';
import Grainient from '../components/Grainient';
import GradualBlur from '../components/GradualBlur';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="flex justify-center">
            <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-tight drop-shadow-lg text-glare">
              Is your skincare
              <span className="block"> actually safe?</span>
            </h1>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Scan any product label and get instant, science-backed insights on what's really in your skincare. No chemistry degree required.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary text-lg px-10 py-4"
            >
              Check My Products
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary text-sm"
            >
              Learn More
            </motion.button>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-8 pt-8 text-white/80">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffe4c9]" />
              <span className="text-sm">Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffe4c9]" />
              <span className="text-sm">10,000+ ingredients</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#ffe4c9]" />
              <span className="text-sm">Science-backed</span>
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
      icon: Microscope,
      title: 'Scan or Type',
      description: "Snap a photo of the ingredient list or paste the text. We'll take it from there, pretty packaging won't fool us.",
    },
    {
      number: '02',
      icon: Sparkles,
      title: 'Analyze',
      description: "Our algorithm cross-references with dermatological databases. Think of it as having a tiny scientist in your pocket.",
    },
    {
      number: '03',
      icon: Check,
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
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold text-[#a24809] mb-4">
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
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="relative bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-[#e8aa80] transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe4c9] rounded-2xl mb-6">
                  <Icon className="w-8 h-8 text-[#a24809]" />
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

  return (
    <div className="relative min-h-screen bg-[#faf5ef]">
      {/* Header */}
      <header
        style={{ backgroundColor: '#F9F4EE', color: '#a24809' }}
        className="sticky top-0 z-[100] flex items-center justify-between px-6 py-3 shadow-sm border-b border-[#e8aa80]/40"
      >
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SkinTel Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
          <span
            className="font-display font-bold text-xl tracking-tight"
            style={{ color: '#a24809' }}
          >
            SkinTel.
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={() => navigate('/auth')}
          style={{ color: '#a24809', borderColor: '#e8aa80' }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/60 backdrop-blur-sm font-medium text-sm hover:bg-[#ffe4c9] transition-all duration-200 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      <Hero />
      <HowItWorks />
      <Footer />

      <GradualBlur
        target="page"
        position="bottom"
        height="8rem"
        strength={2}
        divCount={6}
        curve="bezier"
        exponential={true}
        opacity={1}
      />
    </div>
  );
}
