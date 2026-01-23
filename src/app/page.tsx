"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { ArrowRight, BookOpen, Brain, CalendarCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, MouseEvent, useState, useEffect } from "react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // --- Scroll Animations ---
  // Phase 1: Semicircle reveal (0% - 40% scroll)
  const topSemicircleY = useTransform(scrollYProgress, [0, 0.4], ["0%", "-100%"]);
  const bottomSemicircleY = useTransform(scrollYProgress, [0, 0.4], ["0%", "100%"]);

  // Smooth spring for semicircle motion
  const smoothTopY = useSpring(topSemicircleY, { stiffness: 100, damping: 30 });
  const smoothBottomY = useSpring(bottomSemicircleY, { stiffness: 100, damping: 30 });

  // Hero Text: Fades out after semicircles start parting
  const heroOpacity = useTransform(scrollYProgress, [0.1, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0.1, 0.3], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0.1, 0.3], [0, -50]);

  // Interface "Takeoff": Starts after semicircles have parted significantly
  // Interface "Takeoff": Starts earlier as it enters viewport

  // Mobile detection for responsive animations
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Update on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Interface "Takeoff" Configuration
  // Desktop: [0, 0.20]
  // Mobile: [0, 0.35] (Longer scroll distance, starts further down)
  const scrollEnd = isMobile ? 0.05 : 0.20;

  const interfaceRotate = useTransform(scrollYProgress, [0, scrollEnd], [140, 0]);
  const interfaceScale = useTransform(scrollYProgress, [0, scrollEnd], [0.8, 1]);
  const interfaceY = useTransform(scrollYProgress, [0, scrollEnd], [500, 0]);
  const interfaceOpacity = useTransform(scrollYProgress, [0, 0.01], [0, 1]);

  return (
    <div ref={containerRef} className="relative min-h-[400vh] bg-[#050510] selection:bg-beam-glow/30">

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

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-start pt-0 px-6 w-full md:w-3/4 max-w-7xl mx-auto h-screen min-h-[800px]">

        {/* Top Navigation Mockup */}
        <nav className="w-full flex justify-between items-center py-6 mb-8 text-xs md:text-sm font-medium text-white/60">
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-lg">
            <Brain className="w-4 h-4 md:w-5 md:h-5" /> Notivo
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="flex items-center justify-center hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">Get Started</Link>
          </div>
        </nav>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="flex flex-col items-center text-center w-full"
        >


          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mt-[7%] text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-5xl leading-[1.1] text-white drop-shadow-2xl"
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
            className="mt-8 flex flex-col sm:flex-row gap-4 items-center mb-8 md:mb-12"
          >
            <Link href="/signup">
              <MagneticButton className="group relative flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full bg-white text-black font-bold text-base md:text-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.7)]">
                Try It Free
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* 
            =============================================
            APP INTERFACE MOCKUP (Scroll Driven)
            =============================================
        */}
        <div className="w-full max-w-6xl mt-auto perspective-[2000px]">
          <motion.div
            style={{
              rotateY: interfaceRotate,
              scale: interfaceScale,
              y: interfaceY,
              opacity: interfaceOpacity
            }}
            className="relative w-full transform-style-3d flex justify-center"
          >
            {/* 
               -------------------------------------------
               DESKTOP MOCKUP (Visible on md+)
               -------------------------------------------
            */}
            <div className="hidden md:block relative w-full rounded-t-2xl border-t border-x border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden aspect-[16/9] group">
              {/* Mockup Top Bar */}
              <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Inner Content Placeholder */}
              <div className="p-8 grid grid-cols-12 gap-6 h-full text-left">
                {/* Sidebar Mock */}
                <div className="col-span-3 border-r border-white/5 pr-6 space-y-4">
                  <div className="h-8 w-3/4 bg-white/10 rounded mb-6" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-6 w-full bg-white/5 rounded" />
                    ))}
                  </div>
                </div>

                {/* Kanban Board Mock */}
                <div className="col-span-9">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-10 w-1/3 bg-white/10 rounded" />
                    <div className="flex gap-2">
                      <div className="h-8 w-8 rounded-full bg-purple-500/20" />
                      <div className="h-8 w-8 rounded-full bg-blue-500/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Column 1 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-white/40 mb-2 font-mono">BACKLOG 12</div>
                      <div className="h-32 bg-white/5 rounded border border-white/5 p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-purple-500 h-full" />
                        <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                      </div>
                      <div className="h-24 bg-white/5 rounded border border-white/5 p-4 relative">
                        <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full" />
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-white/40 mb-2 font-mono">IN PROGRESS 3</div>
                      <div className="h-40 bg-white/5 rounded border border-white/5 p-4 relative overflow-hidden ring-1 ring-beam-glow/30">
                        <div className="absolute top-0 left-0 w-1 bg-beam-glow h-full" />
                        <div className="h-4 w-2/3 bg-white/10 rounded mb-3" />
                        <div className="h-20 w-full bg-gradient-to-br from-beam-glow/10 to-transparent rounded" />
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-white/40 mb-2 font-mono">DONE 24</div>
                      <div className="h-28 bg-white/5 rounded border border-white/5 opacity-50" />
                      <div className="h-28 bg-white/5 rounded border border-white/5 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Glass sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            </div>

            {/* 
               -------------------------------------------
               PHONE MOCKUP (Visible on mobile only)
               -------------------------------------------
            */}
            <div className="block md:hidden relative w-[280px] h-[580px] rounded-[2.5rem] border-8 border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden ring-1 ring-white/10">
              {/* Phone Notch/Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-xl z-20" />

              {/* Mobile UI Content */}
              <div className="pt-10 px-5 h-full flex flex-col gap-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                  <div className="h-3 w-3 rounded-full bg-white/20" />
                  <div className="h-2 w-20 bg-white/10 rounded-full" />
                  <div className="h-3 w-3 rounded-full bg-white/20" />
                </div>

                {/* Card 1 (Active) */}
                <div className="w-full h-32 rounded-2xl bg-white/5 border border-white/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-beam-glow h-full" />
                  <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                  <div className="h-14 w-full bg-gradient-to-br from-beam-glow/10 to-transparent rounded-lg" />
                </div>

                {/* Card 2 */}
                <div className="w-full h-24 rounded-2xl bg-white/5 border border-white/5 p-4 relative opacity-70">
                  <div className="absolute top-0 left-0 w-1 bg-purple-500 h-full" />
                  <div className="h-4 w-20 bg-white/10 rounded mb-3" />
                </div>

                {/* Card 3 */}
                <div className="w-full h-24 rounded-2xl bg-white/5 border border-white/5 p-4 relative opacity-40">
                  <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full" />
                </div>
              </div>

              {/* Glass Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            </div>

            {/* Removed bottom fade as requested */}
          </motion.div>
        </div>

      </section>

      {/* Features Section - Standard content below */}
      <section id="features" className="relative z-10 pt-[140vh] pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Built for how students{" "}
              <span className="text-beam-glow">actually</span> learn
            </h2>
            <p className="mt-4 text-foreground/60 text-lg max-w-2xl mx-auto">
              Not another note-taking app. A complete system that understands your courses,
              your professors, and your weaknesses.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="The 4-Year Architect"
              description="Upload your major's course tree. Mark what's done, failed, or in-progress. Watch your entire path re-calculate automatically."
              gradient="from-beam-purple/20 to-beam-glow/10"
              delay={0}
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Smart Resource Pruning"
              description="Tell us if your professor is new. We'll flag old exams as 'low reliability' and focus on what actually matters."
              gradient="from-beam-glow/20 to-beam-glow/5"
              delay={0.1}
            />
            <FeatureCard
              icon={<CalendarCheck className="w-8 h-8" />}
              title="Exam War Room"
              description="Upload your schedule (even as an image). We generate a tactical study plan based on your personal mastery profile."
              gradient="from-white/20 to-white/5"
              delay={0.2}
            />
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
              Notebooks that{" "}
              <span className="text-white decoration-beam-glow underline decoration-wavy underline-offset-4">demand</span> attention
            </h2>
            <p className="mt-4 text-foreground/60 text-lg max-w-2xl mx-auto">
              Haven't opened a course in days? It starts to wiggle and fade — a visual reminder
              before knowledge decay sets in.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 flex-wrap">
            <NotebookCard title="Anatomy" daysAgo={0} />
            <NotebookCard title="Calculus II" daysAgo={2} />
            <NotebookCard title="Physics" daysAgo={5} isWiggling />
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
            Ready to architect your success?
          </h2>
          <p className="relative text-foreground/60 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of students who stopped drowning in notes and started
            engineering their academic future.
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
