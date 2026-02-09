"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, useInView, type MotionValue } from "framer-motion";
import { ArrowRight, BookOpen, Sparkles, Upload, Music, Swords, Layers, Video, Image as ImageIcon, GraduationCap, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef, MouseEvent, useState } from "react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Scroll Animations ---
  // All hero/semicircle/mockup animations driven by the mockup wrapper scroll
  // Interface "Takeoff" Configuration
  // Uses its own scroll context in the sticky wrapper below
  const mockupWrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: mockupProgress } = useScroll({
    target: mockupWrapperRef,
    offset: ["start start", "end end"],
  });

  const interfaceRotate = useTransform(mockupProgress, [0.15, 0.75], [90, 0]);
  const interfaceScale = useTransform(mockupProgress, [0.15, 0.75], [0.75, 1]);
  const interfaceY = useTransform(mockupProgress, [0.15, 0.65], [400, 0]);
  const interfaceOpacity = useTransform(mockupProgress, [0.1, 0.18], [0, 1]);

  // Semicircle curtains — start immediately, finish by 25%
  const topSemicircleY = useTransform(mockupProgress, [0, 0.25], ["0%", "-100%"]);
  const bottomSemicircleY = useTransform(mockupProgress, [0, 0.25], ["0%", "100%"]);
  const smoothTopY = useSpring(topSemicircleY, { stiffness: 100, damping: 30 });
  const smoothBottomY = useSpring(bottomSemicircleY, { stiffness: 100, damping: 30 });

  // Hero text fade — fades as curtains part
  const heroOpacity = useTransform(mockupProgress, [0.03, 0.18], [1, 0]);
  const heroScale = useTransform(mockupProgress, [0.03, 0.18], [1, 0.9]);
  const heroY = useTransform(mockupProgress, [0.03, 0.18], [0, -80]);

  return (
    <div ref={containerRef} className="force-dark relative min-h-[400vh] bg-[#050510] selection:bg-beam-glow/30">

      {/* 
        =============================================
        FULL-SCREEN GLOWING LIGHT BACKGROUND
        The entire background IS the light
        =============================================
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

        {/* Base glow - full screen radial gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 120% 100% at 50% 50%, rgba(59, 130, 246, 0.6) 0%, rgba(14, 165, 233, 0.5) 25%, rgba(6, 182, 212, 0.3) 45%, #050510 75%)',
          }}
        />

        {/* Brighter center glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(56, 189, 248, 0.5) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 75%)',
          }}
        />

        {/* Hot white core */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 50% 35% at 50% 50%, rgba(255, 255, 255, 0.25) 0%, rgba(165, 243, 252, 0.15) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* 
        =============================================
        SEMICIRCLE OVERLAYS (The "Curtains")
        =============================================
      */}

      {/* Top Semicircle - curves DOWN with wide initial gap */}
      <motion.div
        style={{ y: smoothTopY }}
        className="fixed left-1/2 -translate-x-1/2 w-[300vw] h-[120vh] z-[5] pointer-events-none"
      >
        <div
          className="absolute w-full h-full bg-[#050510]"
          style={{
            borderRadius: '0 0 50% 50%',
            bottom: '60%',
          }}
        />
        {/* Glowing edge border */}
        <div
          className="absolute w-full h-full"
          style={{
            borderRadius: '0 0 50% 50%',
            bottom: '60%',
            boxShadow: 'inset 0 -2px 20px 0 rgba(56, 189, 248, 0.6), inset 0 -1px 0 0 rgba(56, 189, 248, 0.8)',
          }}
        />
      </motion.div>

      {/* Bottom Semicircle - curves UP with wide initial gap */}
      <motion.div
        style={{ y: smoothBottomY }}
        className="fixed left-1/2 -translate-x-1/2 w-[300vw] h-[120vh] z-[5] pointer-events-none"
      >
        <div
          className="absolute w-full h-full bg-[#050510]"
          style={{
            borderRadius: '50% 50% 0 0',
            top: '40%',
          }}
        />
        {/* Glowing edge border */}
        <div
          className="absolute w-full h-full"
          style={{
            borderRadius: '50% 50% 0 0',
            top: '40%',
            boxShadow: 'inset 0 2px 20px 0 rgba(56, 189, 248, 0.6), inset 0 1px 0 0 rgba(56, 189, 248, 0.8)',
          }}
        />
      </motion.div>

      {/* Hero + Mockup: sticky scroll-lock wrapper */}
      <section ref={mockupWrapperRef} className="relative z-10 h-[300vh]">
        <div className="sticky top-0 h-screen w-full">

          {/* Hero content — centered */}
          <div className="relative z-10 flex flex-col items-center pt-0 px-6 w-full md:w-3/4 max-w-7xl mx-auto h-full">

            {/* Top Navigation */}
            <nav className="w-full flex justify-between items-center py-6 mb-8 text-xs md:text-sm font-medium text-white/60">
              <div className="flex items-center gap-2 text-white font-bold text-base md:text-lg">
                <Image
                  src="/logo.png"
                  alt="Notiva Logo"
                  width={32}
                  height={32}
                  className="invert"
                />
                Notiva
              </div>
              <div className="flex gap-4">
                <Link href="/login" className="flex items-center justify-center hover:text-white transition-colors">Sign In</Link>
                <Link href="/signup" className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">Get Started</Link>
              </div>
            </nav>

            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
              className="flex flex-col items-center text-center w-full my-auto md:my-0"
            >
              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="mt-0 md:mt-[7%] text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-5xl leading-[1.1] text-white drop-shadow-2xl"
              >
                Everything App
                <br />
                <span className="text-white/50">for your studies</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="mt-4 md:mt-6 text-base md:text-xl text-white/60 max-w-2xl font-light"
              >
                An all-in-one replacement for Notion, Quizlet, and your disorganized Google Drive.
                Open source local-first academic planner.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="mt-8 flex flex-col sm:flex-row gap-4 items-center"
              >
                <Link href="/signup">
                  <MagneticButton className="group relative flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full bg-white text-black font-bold text-base md:text-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.7)]">
                    Try It Free
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                  </MagneticButton>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Mockup — perspective wrapper (parent provides depth for rotateY) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6" style={{ perspective: '2000px' }}>
            <motion.div
              style={{
                rotateY: interfaceRotate,
                scale: interfaceScale,
                y: interfaceY,
                opacity: interfaceOpacity,
              }}
            >
            {/* 
               -------------------------------------------
               DESKTOP MOCKUP (Visible on md+)
               -------------------------------------------
            */}
            <div className="hidden md:block relative w-full rounded-t-2xl border-t border-x border-white/10 shadow-2xl overflow-hidden">
              <Image
                src="/mockup-screenshot.png"
                alt="Notiva course interface"
                width={1920}
                height={1080}
                className="w-full h-auto block"
                draggable={false}
                priority
              />
              {/* Glass sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            </div>

            {/* 
               -------------------------------------------
               PHONE MOCKUP (Visible on mobile only)
               -------------------------------------------
            */}
            <div className="block md:hidden relative mx-auto w-[220px] rounded-[2rem] border-[6px] border-[#1a1a1a] shadow-2xl overflow-hidden ring-1 ring-white/10">
              {/* Phone Notch/Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-b-lg z-20" />
              <Image
                src="/mockup-screenshot-mobile.png"
                alt="Notiva mobile interface"
                width={430}
                height={932}
                className="w-full h-auto block"
                draggable={false}
                priority
              />
              {/* Glass Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
              {/* Bottom fade for clean edge */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1a1a1a] to-transparent pointer-events-none z-10" />
            </div>
          </motion.div>
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "6", label: "AI-Powered Tools" },
                { value: "∞", label: "Ways to Learn" },
                { value: "Short", label: "Generation Time" },
                { value: "1", label: "Upload Needed" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="text-center"
                >
                  <div className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">{stat.value}</div>
                  <div className="text-sm md:text-base text-white/70 uppercase tracking-wider font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works — scroll-pinned with progress bar */}
      <HowItWorks />

      {/* Features Section - Standard content below */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              One upload.{" "}
              <span className="text-beam-glow">Six</span> AI superpowers
            </h2>
            <p className="mt-4 text-foreground/60 text-lg max-w-2xl mx-auto">
              Drop your PDFs, slides, or sheets. Notiva turns them into flashcards,
              songs, video tutorials, infographics, and practice exams — instantly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Upload className="w-8 h-8" />}
              title="Content Engine"
              description="Upload your slides, PDFs, or spreadsheets. AI indexes everything into a searchable knowledge base for each course."
              gradient="from-beam-purple/20 to-beam-glow/10"
              delay={0}
            />
            <FeatureCard
              icon={<Music className="w-8 h-8" />}
              title="AI Study Arsenal"
              description="Flashcards, catchy study songs, animated video tutors, and rich infographics — all generated from your actual course materials."
              gradient="from-beam-glow/20 to-beam-glow/5"
              delay={0.1}
            />
            <FeatureCard
              icon={<Swords className="w-8 h-8" />}
              title="Exam Simulator"
              description="AI generates practice exams matching your course style — MCQs, essays, and figure-based questions with instant AI grading."
              gradient="from-white/20 to-white/5"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Toolbox Grid */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Your AI{" "}
              <span className="text-beam-purple">toolbox</span>
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
              Six tools, one platform. Everything generated from your actual course materials.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Upload className="w-5 h-5" />, title: "Content Engine", description: "AI indexes uploads into a searchable knowledge base", color: "text-blue-400 bg-blue-400/10" },
              { icon: <Layers className="w-5 h-5" />, title: "Flashcards", description: "Smart cards generated from your actual course material", color: "text-purple-400 bg-purple-400/10" },
              { icon: <Music className="w-5 h-5" />, title: "Study Songs", description: "Catchy melodies that turn notes into earworms", color: "text-green-400 bg-green-400/10" },
              { icon: <Video className="w-5 h-5" />, title: "Video Tutor", description: "Animated AI explanations of complex topics", color: "text-orange-400 bg-orange-400/10" },
              { icon: <ImageIcon className="w-5 h-5" />, title: "Infographics", description: "Beautiful visual summaries of dense material", color: "text-pink-400 bg-pink-400/10" },
              { icon: <Swords className="w-5 h-5" />, title: "Exam Simulator", description: "Practice tests with MCQs, essays, and AI grading", color: "text-red-400 bg-red-400/10" },
            ].map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group flex items-start gap-4 p-5 rounded-xl glass hover:bg-white/5 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center shrink-0`}>
                  {tool.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
                  <p className="text-sm text-white/50">{tool.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wiggling Notebooks Preview */}
      <section className="relative z-10 py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Courses that{" "}
              <span className="text-white decoration-beam-glow underline decoration-wavy underline-offset-4">remember</span> you
            </h2>
            <p className="mt-4 text-foreground/60 text-lg max-w-2xl mx-auto">
              Each course tracks when you last studied. Neglect one and it starts to wiggle
              and fade — a visual nudge before knowledge decay kicks in.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 flex-wrap">
            <NotebookCard title="Anatomy" daysAgo={0} />
            <NotebookCard title="Calculus II" daysAgo={2} />
            <NotebookCard title="Physics" daysAgo={5} isWiggling />
          </div>
        </div>
      </section>

      {/* Share Feature */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 text-sm text-beam-glow mb-4 px-3 py-1.5 rounded-full border border-beam-glow/30 bg-beam-glow/5">
                <Share2 className="w-3.5 h-3.5" />
                New Feature
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Share your course{" "}
                <span className="text-beam-glow">with one link</span>
              </h2>
              <p className="text-white/50 text-lg mb-6">
                Generated flashcards, songs, videos, and exams — share everything
                with classmates instantly. No sign-up required to view.
              </p>
              <div className="flex items-center gap-3 text-sm text-white/40">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#0a0a0a] flex items-center justify-center text-xs text-white/60">{i}</div>
                  ))}
                </div>
                Anyone with the link can view
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-beam-glow/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-beam-glow" />
                  </div>
                  <div className="text-sm font-medium text-white">Share Course</div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-sm text-white/50 truncate flex-1 font-mono">notiva.app/shared/aB3kL9mN2x...</div>
                  <div className="px-3 py-1 rounded-md bg-beam-glow/20 text-beam-glow text-xs font-medium">Copied!</div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {["Flashcards", "Songs", "Videos"].map(item => (
                    <div key={item} className="text-center p-2 rounded-lg bg-white/5 text-xs text-white/40">{item}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto glass rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-beam-purple/10 via-transparent to-beam-glow/10 pointer-events-none" />
          <h2 className="relative text-3xl md:text-5xl font-bold mb-4">
            Study smarter, not harder
          </h2>
          <p className="relative text-foreground/60 text-lg mb-8 max-w-xl mx-auto">
            Upload once, learn six different ways. Join students who turned
            their PDFs into an AI-powered study system.
          </p>
          <Link
            href="/signup"
            className="relative inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-black font-semibold text-lg transition-all hover:scale-105 hover:bg-white/90"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Image
              src="/logo.png"
              alt="Notiva"
              width={24}
              height={24}
              className="invert"
            />
            Notiva
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Get Started</Link>
          </div>
          <p className="text-sm text-white/30">&copy; 2026 Notiva. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// --- Micro-Interaction Components ---

function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Magnetic pull strength
      x.set((clientX - centerX) * 0.1);
      y.set((clientY - centerY) * 0.1);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["13deg", "-13deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-13deg", "13deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    // Calculate rotation (0.5 is center)
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    mouseX.set(xPct);
    mouseY.set(yPct);

    // Update spotlight position
    setPosition({ x: mouseXPos, y: mouseYPos });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={divRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative p-8 rounded-2xl glass overflow-hidden transition-all hover:scale-[1.01] border-white/5 hover:border-white/10`}
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />

      {/* Existing Colored Gradient (Still useful for theme, but made subtle) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative transform-style-3d group-hover:translate-z-10 transition-transform duration-500">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-foreground/60 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function NotebookCard({
  title,
  daysAgo,
  isWiggling = false,
}: {
  title: string;
  daysAgo: number;
  isWiggling?: boolean;
}) {
  const opacity = isWiggling ? 0.5 : 1;
  const saturation = isWiggling ? "grayscale" : "";

  return (
    <motion.div
      animate={
        isWiggling
          ? {
            rotate: [0, -2, 2, -2, 0],
            // Updated to be a bit more subtle/organic "breathing" check
            opacity: [0.5, 0.8, 0.5],
            transition: {
              rotate: { repeat: Infinity, duration: 0.5, ease: "easeInOut" as const },
              opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" as const }
            },
          }
          : undefined
      }
      className={`w-48 h-64 rounded-2xl glass p-6 flex flex-col justify-between transition-all ${saturation} border-white/5 bg-[#0e0e0e] hover:bg-[#151515]`}
      style={{ opacity }}
    >
      <div>
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <h4 className="font-semibold text-lg text-white">{title}</h4>
      </div>
      <p className="text-sm text-foreground/40">
        {daysAgo === 0 ? "Opened today" : `${daysAgo} days ago`}
      </p>
    </motion.div>
  );
}

// --- How It Works: Scroll-pinned progress bar ---
const STEPS = [
  { icon: <Upload className="w-6 h-6" />, step: "01", title: "Upload", description: "Drop your PDFs, slides, or spreadsheets into any course." },
  { icon: <Sparkles className="w-6 h-6" />, step: "02", title: "Generate", description: "AI instantly creates flashcards, songs, videos, infographics, and exams." },
  { icon: <GraduationCap className="w-6 h-6" />, step: "03", title: "Study", description: "Pick the format that works for you. Switch anytime." },
];

function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Map scroll to a 0-100 progress. We use the middle 60% of scroll for the bar animation.
  const rawProgress = useTransform(scrollYProgress, [0.25, 0.75], [0, 100]);
  const progress = useSpring(rawProgress, { stiffness: 80, damping: 20 });

  // Determine which cards are "energized": card at 0%, 50%, 100% of bar
  const card0 = useTransform(progress, [0, 5], [0, 1]);
  const card1 = useTransform(progress, [40, 55], [0, 1]);
  const card2 = useTransform(progress, [80, 95], [0, 1]);
  const cardEnergies = [card0, card1, card2];

  return (
    <section ref={sectionRef} className="relative z-10 h-[300vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="max-w-5xl w-full mx-auto">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Three steps.{" "}
              <span className="text-beam-glow">Zero</span> friction
            </h2>
            <p className="mt-4 text-white/50 text-base md:text-lg max-w-2xl mx-auto">
              From raw material to study-ready in under a minute.
            </p>
          </motion.div>

          {/* Desktop layout: horizontal */}
          <div className="hidden md:block">
            {/* Progress rail */}
            <div className="relative mx-auto mb-12" style={{ maxWidth: "80%" }}>
              {/* Background rail */}
              <div className="h-1.5 rounded-full bg-white/10 w-full" />
              {/* Filled progress */}
              <motion.div
                className="absolute top-0 left-0 h-1.5 rounded-full"
                style={{
                  width: useMotionTemplate`${progress}%`,
                  background: "linear-gradient(90deg, #67e8f9, #a5f3fc, #67e8f9)",
                  boxShadow: "0 0 20px rgba(103,232,249,0.9), 0 0 50px rgba(103,232,249,0.5), 0 0 80px rgba(34,211,238,0.3)",
                }}
              />
              {/* Node dots on the rail */}
              {[0, 50, 100].map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                  style={{
                    left: `${pos}%`,
                    transform: `translate(-50%, -50%)`,
                    background: useTransform(cardEnergies[i], [0, 1], ["rgba(255,255,255,0.1)", "#67e8f9"]),
                    borderColor: useTransform(cardEnergies[i], [0, 1], ["rgba(255,255,255,0.2)", "#67e8f9"]),
                    boxShadow: useTransform(cardEnergies[i], [0, 1], ["none", "0 0 16px rgba(103,232,249,0.9), 0 0 30px rgba(103,232,249,0.5)"]),
                  }}
                />
              ))}
            </div>

            {/* Cards row */}
            <div className="grid grid-cols-3 gap-8">
              {STEPS.map((item, i) => (
                <HowItWorksCard key={i} item={item} energy={cardEnergies[i]} />
              ))}
            </div>
          </div>

          {/* Mobile layout: vertical */}
          <div className="md:hidden">
            {/* Vertical rail on the left */}
            <div className="relative flex">
              <div className="relative flex flex-col items-center mr-6 shrink-0" style={{ width: 20 }}>
                {/* Background rail */}
                <div className="w-1.5 rounded-full bg-white/10 h-full absolute left-1/2 -translate-x-1/2" />
                {/* Filled progress */}
                <motion.div
                  className="w-1.5 rounded-full absolute top-0 left-1/2 -translate-x-1/2"
                  style={{
                    height: useMotionTemplate`${progress}%`,
                    background: "linear-gradient(180deg, #67e8f9, #a5f3fc, #67e8f9)",
                    boxShadow: "0 0 20px rgba(103,232,249,0.9), 0 0 50px rgba(103,232,249,0.5), 0 0 80px rgba(34,211,238,0.3)",
                  }}
                />
                {/* Node dots */}
                {[0, 50, 100].map((pos, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
                    style={{
                      top: `${pos}%`,
                      background: useTransform(cardEnergies[i], [0, 1], ["rgba(255,255,255,0.1)", "#67e8f9"]),
                      borderColor: useTransform(cardEnergies[i], [0, 1], ["rgba(255,255,255,0.2)", "#67e8f9"]),
                      boxShadow: useTransform(cardEnergies[i], [0, 1], ["none", "0 0 12px rgba(59,130,246,0.8)"]),
                    }}
                  />
                ))}
              </div>

              {/* Cards stacked */}
              <div className="flex flex-col gap-8 flex-1">
                {STEPS.map((item, i) => (
                  <HowItWorksCard key={i} item={item} energy={cardEnergies[i]} mobile />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksCard({
  item,
  energy,
  mobile = false,
}: {
  item: { icon: React.ReactNode; step: string; title: string; description: string };
  energy: MotionValue<number>;
  mobile?: boolean;
}) {
  return (
    <motion.div
      className={`relative ${mobile ? "text-left" : "text-center"}`}
      style={{
        opacity: useTransform(energy, [0, 1], [0.5, 1]),
        scale: useTransform(energy, [0, 1], [0.97, 1]),
      }}
    >
      <motion.div
        className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border flex items-center justify-center ${mobile ? "" : "mx-auto"} mb-4 md:mb-6 relative`}
        style={{
          background: useTransform(energy, [0, 1], ["#0c0c18", "#0c1a2e"]),
          borderColor: useTransform(energy, [0, 1], ["rgba(255,255,255,0.15)", "rgba(59,130,246,0.5)"]),
          boxShadow: useTransform(energy, [0, 1], [
            "0 0 0 rgba(59,130,246,0)",
            "0 0 30px rgba(59,130,246,0.4), inset 0 0 20px rgba(59,130,246,0.1)",
          ]),
        }}
      >
        <motion.div
          style={{
            color: useTransform(energy, [0, 1], ["rgba(255,255,255,0.45)", "#60a5fa"]),
          }}
        >
          {item.icon}
        </motion.div>
        <motion.span
          className="absolute -top-2 -right-2 text-xs font-mono px-2 py-0.5 rounded-full border"
          style={{
            color: useTransform(energy, [0, 1], ["rgba(255,255,255,0.35)", "#60a5fa"]),
            borderColor: useTransform(energy, [0, 1], ["rgba(255,255,255,0.15)", "rgba(59,130,246,0.5)"]),
            background: useTransform(energy, [0, 1], ["#0c0c18", "#0f1e3d"]),
          }}
        >
          {item.step}
        </motion.span>
      </motion.div>
      <motion.h3
        className="text-lg md:text-xl font-semibold mb-2"
        style={{
          color: useTransform(energy, [0, 1], ["rgba(255,255,255,0.55)", "#ffffff"]),
        }}
      >
        {item.title}
      </motion.h3>
      <motion.p
        className="text-sm md:text-base max-w-xs"
        style={{
          color: useTransform(energy, [0, 1], ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.7)"]),
          ...(mobile ? {} : { margin: "0 auto" }),
        }}
      >
        {item.description}
      </motion.p>
    </motion.div>
  );
}
