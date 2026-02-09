"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Layers, FileText, CheckCircle2 } from "lucide-react";

interface Material {
    id: string;
    title: string;
    type: string;
    content_url: string;
}

interface MaterialSelectorProps {
    courseId: string;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    multiSelect?: boolean;
}

export function MaterialSelector({ courseId, selectedIds, onSelectionChange, multiSelect = true }: MaterialSelectorProps) {
    const supabase = createClient();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            const { data } = await supabase
                .from('course_materials')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data) setMaterials(data);
            setIsLoading(false);
        };
        fetchMaterials();
    }, [courseId, supabase]);

    const handleToggle = (id: string) => {
        if (multiSelect) {
            if (selectedIds.includes(id)) {
                onSelectionChange(selectedIds.filter(i => i !== id));
            } else {
                onSelectionChange([...selectedIds, id]);
            }
        } else {
            // Single select behavior
            onSelectionChange([id]);
        }
    };

    const getIndex = (id: string) => {
        const index = materials.findIndex(m => m.id === id);
        return index !== -1 ? index + 1 : null;
    };

    if (isLoading) {
        return <div className="h-32 flex items-center justify-center text-foreground/40">Loading materials...</div>;
    }

    if (materials.length === 0) {
        return (
            <div className="p-6 text-center border-2 border-dashed border-foreground/10 rounded-2xl">
                <p className="text-foreground/40 text-sm">No materials found.</p>
                <p className="text-foreground/20 text-xs mt-1">Upload PDFs in the Content Engine first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Select Source Material
                </h3>
                <span className="text-xs text-foreground/40">
                    {selectedIds.length} selected
                </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {materials.map((m, idx) => {
                    const isSelected = selectedIds.includes(m.id);
                    const visualIndex = materials.length - idx; // Reverse index since order is descending

                    return (
                        <button
                            key={m.id}
                            onClick={() => handleToggle(m.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 group ${isSelected
                                    ? 'bg-primary/10 border-primary/50 text-foreground'
                                    : 'bg-card-bg border-card-border text-muted-foreground hover:bg-accent/50'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/40 group-hover:bg-foreground/20'
                                }`}>
                                #{visualIndex}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`truncate text-sm font-medium ${isSelected ? 'text-foreground' : ''}`}>
                                    {m.title}
                                </p>
                                <p className="text-xs opacity-60 capitalize">{m.type}</p>
                            </div>

                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
