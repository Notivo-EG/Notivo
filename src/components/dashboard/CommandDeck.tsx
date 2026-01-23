"use client";

import { motion } from "framer-motion";
import { Plus, Calculator, GraduationCap, Bot } from "lucide-react";

export function CommandDeck() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <CommandButton
                icon={<Plus className="w-6 h-6" />}
                label="Add Task"
                color="bg-blue-600 hover:bg-blue-500"
            />
            <CommandButton
                icon={<Calculator className="w-6 h-6" />}
                label="GPA Calc"
                color="bg-white/10 hover:bg-white/20"
            />
            <CommandButton
                icon={<GraduationCap className="w-6 h-6" />}
                label="Log Grade"
                color="bg-white/10 hover:bg-white/20"
            />
            <CommandButton
                icon={<Bot className="w-6 h-6" />}
                label="Ask Buddy"
                color="bg-cyan-600 hover:bg-cyan-500"
            />
        </div>
    );
}

function CommandButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 text-white font-medium transition-colors ${color}`}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </motion.button>
    )
}
