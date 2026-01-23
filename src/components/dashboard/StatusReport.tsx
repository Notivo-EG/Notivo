"use client";

import { motion } from "framer-motion";
import { Activity, TrendingUp, Award } from "lucide-react";

export function StatusReport() {
    return (
        <div className="space-y-6">
            <div className="p-6 rounded-3xl glass border border-white/10">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Ship Status
                </h2>

                <div className="flex items-end justify-between mb-2">
                    <div>
                        <div className="text-4xl font-bold text-white mb-1">3.8</div>
                        <div className="text-sm text-green-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +0.2 this semester
                        </div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-cyan-400 relative flex items-center justify-center">
                        <span className="text-xs font-bold text-cyan-400">GPA</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatusCard
                    label="Assignments"
                    value="12/15"
                    subtext="3 Pending"
                    color="blue"
                />
                <StatusCard
                    label="Attendance"
                    value="92%"
                    subtext="Excellent"
                    color="green"
                />
            </div>
        </div>
    );
}

function StatusCard({ label, value, subtext, color }: { label: string, value: string, subtext: string, color: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/40 mb-2 uppercase">{label}</div>
            <div className="text-xl font-bold text-white mb-1">{value}</div>
            <div className={`text-xs ${color === 'green' ? 'text-green-400' : 'text-blue-400'}`}>{subtext}</div>
        </div>
    )
}
