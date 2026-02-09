"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Moon, Shield, LogOut, Volume2, Monitor, AlertCircle } from "lucide-react";

// ... imports ...

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/context/PreferencesContext";

export default function SettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const { preferences, togglePreference, playSound } = usePreferences();
    const [user, setUser] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch latest enrollment for "University" info
                const { data: enrolls } = await supabase
                    .from('enrollments')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                setEnrollment(enrolls);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleToggle = (key: any) => {
        playSound("click");
        togglePreference(key);
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;

    return (
        <div className="min-h-screen bg-background px-6 py-12 mt-20 md:mt-0 relative overflow-hidden text-foreground">
            {/* Background Glow - Adjusted for Themes */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen dark:mix-blend-normal" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen dark:mix-blend-normal" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                        <Settings className="w-10 h-10 text-blue-500" />
                        Settings & Preferences
                    </h1>
                    <p className="text-foreground/60 text-lg">Manage your academic profile and application experience.</p>
                </motion.div>

                <div className="space-y-8">
                    {/* User Profile Section */}
                    <section className="bg-card-bg backdrop-blur-xl rounded-[2.5rem] p-8 border border-card-border shadow-lg">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-400" />
                            Academic Profile
                        </h2>
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{enrollment?.program_name || "Undecided Major"}</p>
                                    <p className="text-foreground/60">{user?.email}</p>
                                    <p className="text-sm text-blue-400 mt-1">{enrollment?.university_name || "University not set"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    playSound('click');
                                    alert("Profile editing is coming soon!");
                                }}
                                className="px-6 py-2 rounded-full border border-card-border hover:bg-foreground/5 transition-colors text-sm font-medium text-foreground">
                                Edit Profile
                            </button>
                        </div>
                    </section>

                    {/* App Preferences */}
                    <section className="bg-card-bg backdrop-blur-xl rounded-[2.5rem] p-8 border border-card-border shadow-lg">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-blue-400" />
                            Interface Experience
                        </h2>

                        <div className="space-y-6">
                            <ToggleRow
                                icon={Moon}
                                label="Dark Mode"
                                description="Switch between cosmic dark mode and daylight (Experimental)"
                                checked={preferences.darkMode}
                                onChange={() => handleToggle('darkMode')}
                            />

                            <ToggleRow
                                icon={Shield}
                                label="Reduced Motion"
                                description="Minimize animations for a calmer experience"
                                checked={preferences.reducedMotion}
                                onChange={() => handleToggle('reducedMotion')}
                            />

                            <ToggleRow
                                icon={Volume2}
                                label="Sound Effects"
                                description="Play subtle sounds for interactions and generative actions"
                                checked={preferences.soundEffects}
                                onChange={() => handleToggle('soundEffects')}
                            />
                        </div>
                    </section>

                    {/* Notifications */}
                    <section className="bg-card-bg backdrop-blur-xl rounded-[2.5rem] p-8 border border-card-border shadow-lg">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-400" />
                            Notifications & Alerts
                        </h2>

                        <div className="space-y-6">
                            <ToggleRow
                                icon={Bell}
                                label="Study Reminders"
                                description="Daily nudges to keep your streak alive"
                                checked={preferences.studyReminders}
                                onChange={() => handleToggle('studyReminders')}
                            />

                            <ToggleRow
                                icon={AlertCircle}
                                label="Exam Alerts"
                                description="High-priority notifications for upcoming exams"
                                checked={preferences.examAlerts}
                                onChange={() => handleToggle('examAlerts')}
                            />
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="bg-red-500/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-red-500/10">
                        <h2 className="text-xl font-bold mb-6 text-red-500 flex items-center gap-2">
                            <LogOut className="w-5 h-5" />
                            Session
                        </h2>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <p className="text-foreground/60">Sign out of your account on this device</p>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all font-medium whitespace-nowrap"
                            >
                                Log Out
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between gap-4 group">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-xl shrink-0 ${checked ? 'bg-blue-500/20 text-blue-400' : 'bg-foreground/5 text-foreground/40'} transition-colors`}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-foreground group-hover:text-blue-400 transition-colors">{label}</h3>
                    <p className="text-sm text-foreground/50">{description}</p>
                </div>
            </div>

            <button
                onClick={onChange}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 shrink-0 ${checked ? 'bg-blue-600' : 'bg-foreground/10'}`}
            >
                <motion.div
                    layout
                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md"
                    animate={{ x: checked ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
}
