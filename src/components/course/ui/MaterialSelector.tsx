"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Layers, FileText, CheckCircle2, ChevronDown, ChevronRight, GraduationCap, FlaskConical, ScrollText, FileSpreadsheet, Notebook, BookMarked, ClipboardList } from "lucide-react";

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

// Category configuration with icons and display names (same as ContentEngineTab)
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
    lecture_slides: { label: "Lecture Slides", icon: Layers, color: "bg-blue-500/10 text-blue-500" },
    textbook: { label: "Textbook", icon: BookMarked, color: "bg-purple-500/10 text-purple-500" },
    past_exam: { label: "Past Exams", icon: ClipboardList, color: "bg-red-500/10 text-red-500" },
    problem_sheet: { label: "Problem Sheets", icon: FileSpreadsheet, color: "bg-orange-500/10 text-orange-500" },
    notes: { label: "Notes", icon: Notebook, color: "bg-green-500/10 text-green-500" },
    research_paper: { label: "Research Papers", icon: ScrollText, color: "bg-cyan-500/10 text-cyan-500" },
    lab_report: { label: "Lab Reports", icon: FlaskConical, color: "bg-pink-500/10 text-pink-500" },
    syllabus: { label: "Syllabus", icon: GraduationCap, color: "bg-yellow-500/10 text-yellow-500" },
    // Legacy types for backwards compatibility
    slide: { label: "Lecture Slides", icon: Layers, color: "bg-blue-500/10 text-blue-500" },
    sheet: { label: "Problem Sheets", icon: FileSpreadsheet, color: "bg-orange-500/10 text-orange-500" },
};

export function MaterialSelector({ courseId, selectedIds, onSelectionChange, multiSelect = true }: MaterialSelectorProps) {
    const supabase = createClient();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchMaterials = async () => {
            const { data } = await supabase
                .from('course_materials')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data) {
                setMaterials(data);
                // Expand all categories by default
                const categories = new Set<string>(data.map((m: any) => m.type as string));
                setExpandedCategories(categories);
            }
            setIsLoading(false);
        };
        fetchMaterials();
    }, [courseId, supabase]);

    // Group materials by category
    const groupedMaterials = useMemo(() => {
        const groups: Record<string, Material[]> = {};
        materials.forEach(m => {
            const type = m.type || 'notes';
            if (!groups[type]) groups[type] = [];
            groups[type].push(m);
        });
        return groups;
    }, [materials]);

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

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const getCategoryConfig = (type: string) => {
        return CATEGORY_CONFIG[type] || { label: type, icon: FileText, color: "bg-foreground/10 text-foreground" };
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

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(groupedMaterials).map(([category, items]) => {
                    const config = getCategoryConfig(category);
                    const Icon = config.icon;
                    const isExpanded = expandedCategories.has(category);

                    return (
                        <div key={category} className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full p-3 flex items-center gap-2 hover:bg-foreground/5 transition-colors"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                                    <Icon size={16} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-medium text-foreground text-sm">{config.label}</h4>
                                    <p className="text-xs text-foreground/40">
                                        {items.length} {items.length === 1 ? 'file' : 'files'}
                                    </p>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-foreground/40" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-foreground/40" />
                                )}
                            </button>

                            {/* Category Items */}
                            {isExpanded && (
                                <div className="border-t border-card-border">
                                    {items.map((m, idx) => {
                                        const isSelected = selectedIds.includes(m.id);

                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => handleToggle(m.id)}
                                                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all border-b border-card-border last:border-b-0 ${isSelected
                                                    ? 'bg-primary/10 text-foreground'
                                                    : 'hover:bg-foreground/5 text-muted-foreground'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium shrink-0 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-foreground/5 text-foreground/40'
                                                    }`}>
                                                    {idx + 1}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`truncate text-sm ${isSelected ? 'font-medium text-foreground' : ''}`}>
                                                        {m.title}
                                                    </p>
                                                </div>

                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

