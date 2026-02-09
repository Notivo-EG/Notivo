"use client";

import { motion } from "framer-motion";
import { GraduationCap, Building2, ArrowRight, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const UNIVERSITIES = [
    "Cairo University",
    "Ain Shams University",
    "Alexandria University",
    "MIT",
    "Stanford University",
    "Harvard University",
];

const MAJORS = [
    "Computer Science",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Medicine",
    "Pharmacy",
    "Civil Engineering",
    "Architecture",
    "Business Administration",
];

export default function MajorSetupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const newEnrollment = searchParams.get("new") === "true";
    const supabase = createClient();

    const [step, setStep] = useState<1 | 2>(1);
    const [university, setUniversity] = useState("");
    const [major, setMajor] = useState("");
    const [universitySearch, setUniversitySearch] = useState("");
    const [majorSearch, setMajorSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Filter lists
    const filteredUniversities = UNIVERSITIES.filter((u) =>
        u.toLowerCase().includes(universitySearch.toLowerCase())
    );

    const filteredMajors = MAJORS.filter((m) =>
        m.toLowerCase().includes(majorSearch.toLowerCase())
    );

    // Initial Auth Check - AND check if user already has enrollments
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // If not logged in, they can't set up a profile
                router.push("/signup");
                return;
            }

            // Check if user already has any enrollments
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

            if (enrollments && enrollments.length > 0 && !newEnrollment) {
                // User already has an enrollment and is not editing, skip setup and go to dashboard
                router.push("/dashboard");
            }
        };
        checkUser();
    }, [router, supabase, supabase.auth, newEnrollment]);

    const handleContinue = async () => {
        if (step === 1 && university) {
            setStep(2);
        } else if (step === 2 && major) {
            await saveEnrollment();
        }
    };

    const saveEnrollment = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/signup");
                return;
            }

            // Insert into 'enrollments' table
            const { error } = await supabase
                .from('enrollments')
                .insert({
                    user_id: user.id,
                    university_name: university,
                    program_name: major,
                    is_minor: false,
                    ui_theme: 'default' // We can let them pick this later
                });

            if (error) {
                console.error("Error saving enrollment:", error);
                alert("Failed to save profile. Please try again.");
                return;
            }

            // Success -> Redirect to Dashboard
            router.push("/dashboard");

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden selection:bg-sky-500/30">
            {/* 
              =============================================
              FULL-SCREEN GLOWING LIGHT BACKGROUND 
              =============================================
            */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 120% 100% at 50% 50%, rgba(59, 130, 246, 0.5) 0%, rgba(14, 165, 233, 0.4) 25%, rgba(6, 182, 212, 0.2) 45%, #050510 75%)',
                    }}
                />
            </div>

            {/* Progress Indicator */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= 1 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"}`} />
                <div className="w-12 h-0.5 bg-white/10 relative overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step >= 2 ? "100%" : "50%" }}
                        className="h-full bg-blue-500"
                    />
                </div>
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= 2 ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/10"}`} />
            </div>

            {/* Setup Card Container with Perspective */}
            <div className="w-full max-w-lg perspective-[2000px] relative z-10">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, rotateY: -10, x: step === 1 ? -20 : 20 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    exit={{ opacity: 0, rotateY: 10, x: step === 1 ? 20 : -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 transform-style-3d border border-white/10 shadow-2xl relative"
                >
                    {/* Glowing edge highlight */}
                    <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />

                    {step === 1 ? (
                        <>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-md">
                                    <Building2 className="w-7 h-7 text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Select University</h1>
                                    <p className="text-white/50">Where are you studying?</p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    value={universitySearch}
                                    onChange={(e) => setUniversitySearch(e.target.value)}
                                    placeholder="Search universities..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            {/* University List */}
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredUniversities.map((uni) => (
                                    <motion.button
                                        key={uni}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setUniversity(uni)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border ${university === uni
                                            ? "bg-blue-600/20 border-blue-500/30 text-white shadow-lg shadow-blue-900/20 backdrop-blur-md"
                                            : "bg-white/5 border-transparent text-white/70 hover:bg-white/10"
                                            }`}
                                    >
                                        <span className="font-medium">{uni}</span>
                                    </motion.button>
                                ))}
                                {filteredUniversities.length === 0 && (
                                    <button
                                        onClick={() => setUniversity(universitySearch)}
                                        className="w-full p-4 rounded-xl text-left transition-all border bg-white/5 border-dashed border-white/20 text-white/60 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10"
                                    >
                                        <span className="block text-sm">Not found? Use:</span>
                                        <span className="font-bold text-blue-400">&quot;{universitySearch}&quot;</span>
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center backdrop-blur-md">
                                    <GraduationCap className="w-7 h-7 text-cyan-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Select Major</h1>
                                    <p className="text-white/50">What are you studying at {university}?</p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="text"
                                    value={majorSearch}
                                    onChange={(e) => setMajorSearch(e.target.value)}
                                    placeholder="Search majors..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                />
                            </div>

                            {/* Major List */}
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredMajors.map((m) => (
                                    <motion.button
                                        key={m}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setMajor(m)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border ${major === m
                                            ? "bg-cyan-600/20 border-cyan-500/30 text-white shadow-lg shadow-cyan-900/20 backdrop-blur-md"
                                            : "bg-white/5 border-transparent text-white/70 hover:bg-white/10"
                                            }`}
                                    >
                                        <span className="font-medium">{m}</span>
                                    </motion.button>
                                ))}
                                {filteredMajors.length === 0 && (
                                    <button
                                        onClick={() => setMajor(majorSearch)}
                                        className="w-full p-4 rounded-xl text-left transition-all border bg-white/5 border-dashed border-white/20 text-white/60 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10"
                                    >
                                        <span className="block text-sm">Not found? Use:</span>
                                        <span className="font-bold text-cyan-400">&quot;{majorSearch}&quot;</span>
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Continue Button */}
                    <motion.button
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        onClick={handleContinue}
                        disabled={(step === 1 ? !university : !major) || isLoading}
                        className={`relative group w-full mt-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 overflow-hidden border border-white/10 backdrop-blur-md ${(step === 1 ? university : major) && !isLoading
                            ? step === 1
                                ? "bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-500/20 text-white hover:brightness-125 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                                : "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-white hover:brightness-125 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                            : "bg-white/5 text-white/20 cursor-not-allowed border-transparent"
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                            <>
                                {(step === 1 ? university : major) && (
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                )}
                                <span className="relative z-10">{step === 1 ? "Next Step" : "Complete Setup"}</span>
                                <ArrowRight className="w-5 h-5 relative z-10" />
                            </>
                        )}
                    </motion.button>

                    {step === 2 && !isLoading && (
                        <button
                            onClick={() => setStep(1)}
                            className="w-full mt-4 py-3 text-white/30 hover:text-white transition-colors"
                        >
                            Back to University
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
