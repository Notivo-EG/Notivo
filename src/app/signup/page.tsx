"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { usePreferences } from "@/context/PreferencesContext";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { playSound } = usePreferences();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                alert(error.message);
                return;
            }

            // Successful signup!
            // In a real app we might wait for email verification, 
            // but for dev/local we often have auto-confirm on.
            // Let's assume they can proceed or are redirected.
            // If email confirm is on, supabase returns no session immediately.
            // But usually we can redirect to a "check email" page or /setup if auto-confirm.

            router.push("/setup");
        } catch (err) {
            console.error("Signup failed", err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden selection:bg-sky-500/30">
            {/* 
              =============================================
              FULL-SCREEN GLOWING LIGHT BACKGROUND 
              (Matching Hero Section)
              =============================================
            */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 120% 100% at 50% 50%, rgba(59, 130, 246, 0.15) 0%, rgba(14, 165, 233, 0.1) 25%, rgba(6, 182, 212, 0.05) 45%, var(--background) 75%)',
                    }}
                />
            </div>



            {/* Signup Card Container with Perspective */}
            <div className="w-full max-w-md perspective-[2000px] relative z-10">
                <motion.div
                    initial={{ opacity: 0, rotateY: -30, y: 60 }}
                    animate={{ opacity: 1, rotateY: 0, y: 0 }}
                    transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1] // Custom ease for smooth "swing"
                    }}
                    // Ethereal Glass Card
                    className="w-full bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 transform-style-3d border border-white/10 shadow-2xl relative"
                >
                    {/* Glowing edge highlight for the card */}
                    <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-white">Start Your Journey</h1>
                        <p className="text-white/50">Create an account to begin architecting your degree</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-white/70">
                                Full Name
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-white/70">
                                University Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@university.edu"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-white/70">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-white/30 mt-1">Minimum 8 characters</p>
                        </div>

                        {/* Submit Button (Ethereal) */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            onClick={() => {playSound('click')}}
                            className="relative group w-full mt-4 py-4 rounded-full font-bold text-lg text-white overflow-hidden transition-all hover:brightness-125 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-95 border border-white/10 bg-gradient-to-r from-blue-500/80 via-indigo-500/80 to-purple-500/80 backdrop-blur-md"
                        >
                            <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            {loading ? "Creating Account..." : "Create Account"}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-foreground/10" />
                        <span className="text-foreground/30 text-sm">or</span>
                        <div className="flex-1 h-px bg-foreground/10" />
                    </div>

                    {/* OAuth Buttons */}
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--foreground-rgb), 0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => playSound('click')}
                        className="w-full py-4 rounded-full bg-foreground/5 border border-foreground/10 text-foreground font-medium transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    >
                        Continue with Google
                    </motion.button>

                    {/* Login Link */}
                    <p className="text-center mt-8 text-foreground/50">
                        Already have an account?{" "}
                        <Link href="/login" onClick={() => playSound('click')} className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
