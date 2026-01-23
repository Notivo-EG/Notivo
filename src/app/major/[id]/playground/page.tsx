"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, Reorder } from "framer-motion";
import { ArrowLeft, GripVertical, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/context/PreferencesContext";

// --- Types ---
interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    status: number; // mapped from db text if needed, or just use text
    source_config: {
        prerequisites?: string[]; // List of Codes
        semester?: number;
    };
}

interface Column {
    id: string;
    title: string;
    courses: Course[];
}

// --- Scheduler Logic ---
const MAX_CREDITS_PER_SEM = 24; // Relaxed limit to allow heavy semesters (19-21 credits)

function autoSchedule(courses: Course[]): Record<string, Course[]> {
    const newColumns: Record<string, Course[]> = {
        'backlog': [],
        'sem-1': [], 'sem-2': [], 'sem-3': [], 'sem-4': [],
        'sem-5': [], 'sem-6': [], 'sem-7': [], 'sem-8': []
    };

    // 1. Separate Fixed vs Floating courses
    const fixedCourses: Course[] = [];
    const floatingCourses: Course[] = [];

    courses.forEach(c => {
        const sem = c.source_config?.semester;
        if (sem && sem >= 1 && sem <= 8) {
            newColumns[`sem-${sem}`].push(c);
            fixedCourses.push(c);
        } else {
            floatingCourses.push(c);
        }
    });

    // 2. If we have floating courses, try to schedule them topologically
    // If NO fixed courses exist (legacy import), run full Topo Sort
    if (fixedCourses.length === 0 && floatingCourses.length > 0) {
        // Build Graph
        const adj = new Map<string, string[]>();
        const inDegree = new Map<string, number>();
        const courseMap = new Map<string, Course>();

        courses.forEach(c => {
            courseMap.set(c.code, c);
            if (!inDegree.has(c.code)) inDegree.set(c.code, 0);
            (c.source_config.prerequisites || []).forEach(pCode => {
                if (courses.some(ic => ic.code === pCode)) {
                    if (!adj.has(pCode)) adj.set(pCode, []);
                    adj.get(pCode)?.push(c.code);
                    inDegree.set(c.code, (inDegree.get(c.code) || 0) + 1);
                }
            });
        });

        const queue = courses.filter(c => (inDegree.get(c.code) || 0) === 0);
        let semIndex = 1;

        while (queue.length > 0) {
            const semLoad: Course[] = [];
            let semCredits = 0;
            const nextQueue: Course[] = [];

            // Sort by credits descending (Knapsack-ish)
            queue.sort((a, b) => b.credits - a.credits);

            for (const course of queue) {
                if (semCredits + course.credits <= MAX_CREDITS_PER_SEM) {
                    semLoad.push(course);
                    semCredits += course.credits;
                } else {
                    nextQueue.push(course);
                }
            }

            // Assign
            if (semIndex <= 8) newColumns[`sem-${semIndex}`] = semLoad;
            else newColumns['backlog'].push(...semLoad);

            // Unlock next
            const unlocked: Course[] = [];
            semLoad.forEach(c => {
                const neighbors = adj.get(c.code) || [];
                neighbors.forEach(nCode => {
                    inDegree.set(nCode, (inDegree.get(nCode) || 0) - 1);
                    if (inDegree.get(nCode) === 0) {
                        const nCourse = courseMap.get(nCode);
                        if (nCourse) unlocked.push(nCourse);
                    }
                });
            });

            queue.length = 0;
            queue.push(...nextQueue, ...unlocked);
            semIndex++;
            if (semIndex > 8 && queue.length > 0) {
                newColumns['backlog'].push(...queue);
                break;
            }
        }
    } else {
        // Just dump the remaining floating courses into Backlog if we had Fixed courses
        // This is safer than mixing logics
        newColumns['backlog'].push(...floatingCourses);
    }

    return newColumns;
}

export default function PlaygroundPage() {
    const params = useParams();
    const enrollmentId = params.id as string;
    const supabase = createClient();
    const { playSound } = usePreferences();

    const [courses, setCourses] = useState<Course[]>([]);
    const [columns, setColumns] = useState<Record<string, Course[]>>({});
    const [loading, setLoading] = useState(true);

    // --- Interactvity State ---
    const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);
    const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
    const [lines, setLines] = useState<{ start: string, end: string, startCode: string, endCode: string, status: 'ok' | 'violation' }[]>([]);

    // Pan & Zoom State
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Arrow Calculation ---
    useEffect(() => {
        // Debounce calculation to allow layout to settle
        const timer = setTimeout(calculateLines, 100);
        return () => clearTimeout(timer);
    }, [columns, loading]); // Recalc when board changes

    const calculateLines = () => {
        if (!containerRef.current) return;
        // We calculate lines relative to the inner CONTENT, not the viewport.
        // But since our nodes are inside the transformed content, we can use their offsetLeft/Top if we are careful,
        // OR we just use getBoundingClientRect and reverse-engineer the transform.
        // EASIER: Just use getBoundingClientRect relative to the BOARD container (untransformed if possible, or handle scale).

        // Actually for simplicity in this "DOM-based" canvas:
        // We will calculate lines purely based on relative DOM positions.
        // It's tricky with Zoom. 
        // Strategy: We store lines as logical connections, and let SVG render them.
        // BUT calculating (x,y) from DOM while Zoomed is hard.

        // BETTER: Reset transform temporarily? No.
        // Workaround: We use `offsetLeft` and `offsetTop` of the cards relative to the `.board-content`.

        const newLines: typeof lines = [];

        // Map course code to its semester index for violation check
        const courseSemIndex: Record<string, number> = {};
        Object.entries(columns).forEach(([colId, colCourses]) => {
            const index = colId === 'backlog' ? -1 : parseInt(colId.split('-')[1]);
            colCourses.forEach(c => courseSemIndex[c.code] = index);
        });

        Object.values(columns).flat().forEach(course => {
            const prereqs = course.source_config?.prerequisites || [];
            prereqs.forEach(startCode => {
                const startEl = document.getElementById(`node-${startCode}-out`);
                const endEl = document.getElementById(`node-${course.code}-in`);

                if (startEl && endEl) {
                    // Logic: Get coordinates relative to the SCROLLABLE/TRANSFORMABLE parent.
                    // This creates lines that "stick" to the cards inside the zoom container.
                    const parentRect = containerRef.current!.getBoundingClientRect();
                    const startRect = startEl.getBoundingClientRect();
                    const endRect = endEl.getBoundingClientRect();

                    // We must divide by current scale to get "true" internal coordinates?
                    // actually if the SVG is ALSO scaled, we just need coordinates relative to the scaled origin?
                    // Let's try simple relative calc first.

                    // Inverse Transform Logic for internal SVG coords:
                    // xL = (xS - xT) / s
                    const s = transform.scale;

                    const startX = (startRect.left - parentRect.left) / s;
                    const startY = (startRect.top - parentRect.top) / s;
                    const endX = (endRect.left - parentRect.left) / s;
                    const endY = (endRect.top - parentRect.top) / s;

                    // Violation logic
                    const startSem = courseSemIndex[startCode];
                    const endSem = courseSemIndex[course.code];
                    let isViolation = false;
                    if (startSem === -1 || endSem === -1) {
                        if (endSem !== -1 && startSem === -1) isViolation = true;
                    } else {
                        if (startSem >= endSem) isViolation = true;
                    }

                    newLines.push({
                        start: `${startX},${startY}`,
                        end: `${endX},${endY}`,
                        startCode,
                        endCode: course.code,
                        status: isViolation ? 'violation' : 'ok'
                    });
                }
            });
        });
        setLines(newLines);
    };


    // --- Drag Handlers ---
    const handleDragStart = (e: React.DragEvent, course: Course) => {
        e.stopPropagation(); // Don't pan
        setDraggedCourse(course);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedCourse) return;

        // Find source column
        const sourceEntry = Object.entries(columns).find(([_, list]) => list.find(c => c.id === draggedCourse.id));
        if (!sourceEntry) return;
        const [sourceColId, sourceList] = sourceEntry;

        if (sourceColId === targetColId) return;

        const newSourceList = sourceList.filter(c => c.id !== draggedCourse.id);
        const newTargetList = [...(columns[targetColId] || []), draggedCourse];

        setColumns(prev => ({ ...prev, [sourceColId]: newSourceList, [targetColId]: newTargetList }));
        setHasChanges(true); // Enable Save Button
        setDraggedCourse(null);
    };

    // --- Pan/Zoom Handlers ---
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            setTransform(p => ({ ...p, scale: Math.min(Math.max(0.2, p.scale + delta), 2) }));
        } else {
            // Standard scroll or pan? Let's pan on Scroll for "Infinite Canvas" feel
            const speed = 1;
            setTransform(p => ({ ...p, x: p.x - e.deltaX * speed, y: p.y - e.deltaY * speed }));
        }
    };

    // --- Touch Handlers (Auto-Added) ---
    const [lastTouch, setLastTouch] = useState<{ x: number, y: number, dist: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 });
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setLastTouch({ x: 0, y: 0, dist });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!lastTouch) return;
        // e.preventDefault(); // React synthetic events might complain if not passive?

        if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - lastTouch.x;
            const deltaY = e.touches[0].clientY - lastTouch.y;
            setTransform(p => ({ ...p, x: p.x + deltaX, y: p.y + deltaY }));
            setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 });
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const deltaScale = (dist - lastTouch.dist) * 0.005;
            setTransform(p => ({ ...p, scale: Math.min(Math.max(0.2, p.scale + deltaScale), 2) }));
            setLastTouch({ x: 0, y: 0, dist });
        }
    };

    const handleTouchEnd = () => setLastTouch(null);

    // Fetch Data
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('student_courses')
                .select('*')
                .eq('enrollment_id', enrollmentId);

            if (data) {
                const typedData = data.map(d => ({
                    ...d,
                    credits: d.source_config?.credits || 3, // Fallback
                    source_config: d.source_config || { prerequisites: [] }
                }));
                setCourses(typedData);
                const scheduled = autoSchedule(typedData);
                setColumns(scheduled);
            }
            setLoading(false);
        };
        load();
    }, [enrollmentId]);

    // --- Save & Validation Logic ---
    const [hasChanges, setHasChanges] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [violations, setViolations] = useState<{ course: string, prereq: string }[]>([]);

    const checkViolations = (currentColumns: Record<string, Course[]>) => {
        const foundViolations: { course: string, prereq: string }[] = [];
        const courseSemIndex: Record<string, number> = {};

        Object.entries(currentColumns).forEach(([colId, colCourses]) => {
            const index = colId === 'backlog' ? -1 : parseInt(colId.split('-')[1]);
            colCourses.forEach(c => courseSemIndex[c.code] = index);
        });

        Object.values(currentColumns).flat().forEach(course => {
            const prereqs = course.source_config?.prerequisites || [];
            prereqs.forEach(prereqCode => {
                const startSem = courseSemIndex[prereqCode];
                const endSem = courseSemIndex[course.code];

                // If prereq is missing (startSem undefined), we ignore it or treat as backlog (-1)
                // If current course is in backlog (endSem -1), it's "safe" usually, but technically valid?
                // Let's say: Violation if Start >= End, UNLESS End is backlog (not scheduled yet)
                // Wait, if Prereq is in Backlog (startSem -1) and Current is Scheduled (endSem > 0), THAT IS A VIOLATION.

                if (startSem !== undefined && endSem !== undefined) {
                    if (endSem !== -1) { // If current course is scheduled
                        if (startSem === -1 || startSem >= endSem) {
                            foundViolations.push({ course: course.code, prereq: prereqCode });
                        }
                    }
                }
            });
        });
        return foundViolations;
    };

    const handleSaveClick = () => {
        const v = checkViolations(columns);
        setViolations(v);
        setShowSaveModal(true);
    };

    const confirmSave = async () => {
        setIsSaving(true);
        try {
            // Prepared updates
            const updates = [];

            for (const [colId, colCourses] of Object.entries(columns)) {
                // Determine new semester value
                // 'backlog' -> 0 (or null? standardizing to 0 for unassigned)
                // 'sem-N' -> N
                const newSemester = colId === 'backlog' ? 0 : parseInt(colId.split('-')[1]);

                for (const course of colCourses) {
                    // Update the course in DB with new semester
                    // We need to update BOTH the top-level 'semester' (if we added it to schema)
                    // AND the 'source_config.semester' field for consistency.
                    // Based on previous files, we use source_config.semester mostly.

                    updates.push(
                        supabase.from('student_courses')
                            .update({
                                source_config: {
                                    ...course.source_config,
                                    semester: newSemester
                                }
                            })
                            .eq('id', course.id)
                    );
                }
            }

            // Run all updates (Parallel for speed, or sequential?)
            // Parallel is fine for Supabase usually
            await Promise.all(updates);

            setHasChanges(false);
            setShowSaveModal(false);
            // Optional: Show success toast
        } catch (err) {
            console.error(err);
            alert("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="bg-background h-screen text-foreground flex items-center justify-center">Loading Board...</div>;

    return (
        <div className="fixed inset-0 w-screen h-screen bg-background text-foreground flex flex-col overflow-hidden select-none z-[100]">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-card-bg/90 backdrop-blur-md border-b border-card-border px-6 py-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <Link href={`/major/${enrollmentId}`} onClick={() => playSound('click')} className="p-2 rounded-full hover:bg-foreground/10 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="font-bold text-xl hidden md:block text-foreground">Architect Playground</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm font-medium hidden md:flex">
                        <div className="flex items-center gap-2 text-blue-500">
                            <div className="w-2 h-2 rounded-full bg-blue-500 box-shadow-glow" />
                            <span>Ok</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-500">
                            <div className="w-2 h-2 rounded-full bg-red-500 box-shadow-glow" />
                            <span>Violation</span>
                        </div>
                        <div className="h-4 w-[1px] bg-foreground/10 mx-2" />
                        <span className="text-foreground/30 text-xs">Scroll to Pan • Ctrl+Scroll to Zoom</span>
                    </div>

                    <button
                        onClick={() => { handleSaveClick(); playSound('click'); }}
                        disabled={!hasChanges}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${hasChanges
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-foreground/5 text-foreground/20 cursor-not-allowed'
                            }`}
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowSaveModal(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-lg bg-card-bg rounded-3xl p-8 border border-card-border shadow-2xl z-50 text-foreground"
                    >
                        {violations.length > 0 ? (
                            <>
                                <div className="flex items-center gap-3 text-red-500 mb-4">
                                    <AlertCircle size={28} />
                                    <h3 className="text-2xl font-bold text-foreground">Prerequisite Violations</h3>
                                </div>
                                <p className="text-foreground/60 mb-6">
                                    The following courses are scheduled <b>before</b> their prerequisites are completed.
                                    This might delay your graduation or require waivers.
                                </p>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 max-h-60 overflow-y-auto custom-scrollbar">
                                    {violations.map((v, i) => (
                                        <div key={i} className="flex items-center gap-3 mb-2 last:mb-0 text-sm">
                                            <span className="font-mono font-bold text-red-400">{v.course}</span>
                                            <span className="text-foreground/40">needs</span>
                                            <span className="font-mono font-bold text-foreground/60">{v.prereq}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSaveModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { confirmSave(); playSound('click'); }}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex justify-center"
                                    >
                                        {isSaving ? "Saving..." : "Override & Save"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 text-blue-500 mb-4">
                                    <CheckCircle2 size={28} />
                                    <h3 className="text-2xl font-bold text-foreground">Save New Order?</h3>
                                </div>
                                <p className="text-foreground/60 mb-8">
                                    This will update your main dashboard roadmap with the new semester arrangement.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSaveModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { confirmSave(); playSound('click'); }}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex justify-center"
                                    >
                                        {isSaving ? "Saving..." : "Confirm Save"}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Infinite Canvas */}
            <div
                className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative bg-background"
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)`,
                        backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
                        backgroundPosition: `${transform.x}px ${transform.y}px`
                    }}
                />

                <div
                    ref={containerRef}
                    className="origin-top-left transition-transform duration-75 ease-out min-w-max h-full flex items-center p-20"
                    style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
                >
                    {/* SVG Connector Layer */}
                    <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
                        <defs>
                            <marker id="arrow-ok" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L6,3 z" fill="#60a5fa" />
                            </marker>
                            <marker id="arrow-violation" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                            </marker>
                        </defs>
                        {lines.map((line, i) => {
                            // Smart Lines Logic:
                            // Show if: 1. It is a Violation (Always show red lines)
                            //          2. The user is hovering either the start or end node (Show focus lines)
                            const isFocused = hoveredCourseId === line.startCode || hoveredCourseId === line.endCode;
                            const isViolation = line.status === 'violation';

                            if (!isFocused && !isViolation) return null;

                            const [x1, y1] = line.start.split(',').map(Number);
                            const [x2, y2] = line.end.split(',').map(Number);

                            // Bezier
                            const dist = Math.abs(x2 - x1);
                            const cp1x = x1 + dist * 0.5;
                            const cp1y = y1;
                            const cp2x = x2 - dist * 0.5;
                            const cp2y = y2;
                            const path = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

                            return (
                                <motion.path
                                    key={i}
                                    d={path}
                                    stroke={isViolation ? '#ef4444' : '#60a5fa'}
                                    strokeWidth={isFocused ? 3 : 2}
                                    strokeOpacity={isFocused || isViolation ? 0.8 : 0.2}
                                    fill="none"
                                    markerEnd={`url(#arrow-${line.status})`}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                />
                            );
                        })}
                    </svg>

                    {/* Columns Render */}
                    <div className="flex gap-8">
                        {['backlog', 'sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'].map(colId => {
                            const isBacklog = colId === 'backlog';
                            const courses = columns[colId] || [];
                            const credits = courses.reduce((sum, c) => sum + c.credits, 0);

                            return (
                                <div
                                    key={colId}
                                    className={`flex-shrink-0 flex flex-col ${isBacklog ? 'w-80' : 'w-96'}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, colId)}
                                >
                                    <div className={`mb-6 pb-3 border-b-2 ${isBacklog ? 'border-dashed border-foreground/10' : 'border-foreground/10'} flex items-end justify-between`}>
                                        <div>
                                            <div className={`font-bold ${isBacklog ? 'text-foreground/40 text-xl' : 'text-2xl text-foreground'}`}>
                                                {isBacklog ? 'BACKLOG' : `Semester ${colId.split('-')[1]}`}
                                            </div>
                                        </div>
                                        {!isBacklog && (
                                            <div className={`text-base font-mono font-bold ${credits > MAX_CREDITS_PER_SEM ? 'text-red-400' : 'text-blue-400'}`}>
                                                {credits} PTS
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex-1 rounded-3xl p-4 min-h-[600px] transition-all bg-card-bg/20 border-2 ${isBacklog ? 'border-dashed border-foreground/5' : 'border-transparent hover:border-foreground/10'
                                        }`}>
                                        {courses.map(course => (
                                            <motion.div
                                                layoutId={course.id}
                                                key={course.id}
                                                draggable
                                                onDragStart={(e) => { handleDragStart(e as any, course); playSound('click'); }}
                                                onDragEnd={(e) => { e.stopPropagation(); calculateLines(); }}
                                                onMouseEnter={() => setHoveredCourseId(course.code)}
                                                onMouseLeave={() => setHoveredCourseId(null)}
                                                className={`relative z-10 group p-5 mb-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing shadow-lg
                                                ${hoveredCourseId === course.code ? 'bg-blue-600/20 border-blue-500 scale-105 z-20 shadow-blue-500/20' : 'bg-card-bg border-card-border hover:bg-foreground/5'}
                                            `}
                                            >
                                                <div className="flex justify-between items-start mb-3 pointer-events-none">
                                                    <span className={`font-mono font-bold text-lg ${hoveredCourseId === course.code ? 'text-blue-500' : 'text-foreground/70'}`}>{course.code}</span>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[11px] uppercase font-extrabold tracking-wider px-2 py-1 rounded bg-foreground/10 text-foreground/40">{course.credits} pts</span>
                                                        {course.source_config?.semester && (
                                                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                                                                AI: Sem {course.source_config.semester}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-base font-medium leading-snug text-foreground/90 pointer-events-none">{course.name}</div>

                                                {/* Connector Anchors */}
                                                <div id={`node-${course.code}-in`} className="absolute top-1/2 -left-2 w-4 h-4" />
                                                <div id={`node-${course.code}-out`} className="absolute top-1/2 -right-2 w-4 h-4" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Zoom Controls */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-50">
                <button
                    onClick={() => { setTransform(p => ({ ...p, scale: Math.min(p.scale + 0.2, 2) })); playSound('click'); }}
                    className="w-12 h-12 rounded-full bg-card-bg backdrop-blur-md border border-card-border flex items-center justify-center hover:bg-foreground/10 transition-all text-foreground shadow-lg"
                >
                    <Plus size={24} />
                </button>
                <button
                    onClick={() => { setTransform(p => ({ ...p, scale: Math.max(p.scale - 0.2, 0.2) })); playSound('click'); }}
                    className="w-12 h-12 rounded-full bg-card-bg backdrop-blur-md border border-card-border flex items-center justify-center hover:bg-foreground/10 transition-all text-foreground shadow-lg"
                >
                    <span className="text-2xl font-bold mb-1">-</span>
                </button>
            </div>
        </div>
    );
}
