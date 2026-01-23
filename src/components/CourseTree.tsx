"use client";

import { motion } from "framer-motion";
import { Lock, AlertCircle, Check, Clock, PlayCircle, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

type NodeStatus = "done" | "enrolled" | "failed" | "locked" | "available";

interface TreeNode {
    id: string;
    label: string;
    status: NodeStatus;
    x: number;
    y: number;
    dependsOn: string[];
}

// Initial Graph State
const INITIAL_NODES: TreeNode[] = [
    { id: "calc1", label: "Calculus I", status: "done", x: 50, y: 10, dependsOn: [] },
    { id: "phys1", label: "Physics I", status: "done", x: 20, y: 30, dependsOn: [] },
    { id: "prog1", label: "Programming I", status: "failed", x: 80, y: 30, dependsOn: [] },

    { id: "calc2", label: "Calculus II", status: "enrolled", x: 50, y: 40, dependsOn: ["calc1"] },

    { id: "phys2", label: "Physics II", status: "locked", x: 20, y: 60, dependsOn: ["phys1", "calc2"] },
    { id: "prog2", label: "Programming II", status: "locked", x: 80, y: 60, dependsOn: ["prog1"] },

    { id: "adv_calc", label: "Adv. Math", status: "locked", x: 50, y: 80, dependsOn: ["calc2"] },
];

export function CourseTree({ isSimulationOnly = false }: { isSimulationOnly?: boolean }) {
    const [nodes, setNodes] = useState<TreeNode[]>(INITIAL_NODES);
    const [simulationMode, setSimulationMode] = useState(isSimulationOnly);

    // Simulation Logic: Cycle Status & Propagate
    const handleNodeClick = (nodeId: string) => {
        if (!simulationMode) return;

        setNodes((prevNodes) => {
            const newNodes = prevNodes.map((n) => {
                if (n.id === nodeId) {
                    // Cycle: Done -> Failed -> Enrolled -> Done...
                    const nextStatus: Record<string, NodeStatus> = {
                        done: "failed",
                        failed: "enrolled",
                        enrolled: "done",
                        available: "done", // If clicking available, assume taking it
                        locked: "locked", // Locked stays locked (must unlock parent)
                    };
                    return { ...n, status: nextStatus[n.status] || n.status };
                }
                return n;
            });
            return propagateDependencies(newNodes);
        });
    };

    // Dependency Propagation Engine
    const propagateDependencies = (currentNodes: TreeNode[]): TreeNode[] => {
        let hasChanged = true;
        let computedNodes = [...currentNodes];

        // Iteratively resolve dependencies until stable
        while (hasChanged) {
            hasChanged = false;
            computedNodes = computedNodes.map(node => {
                if (node.dependsOn.length === 0) return node; // Root nodes don't change automatically

                const parents = computedNodes.filter(p => node.dependsOn.includes(p.id));

                // Check if ANY parent is failed/locked -> Node becomes LOCKED
                const parentFailed = parents.some(p => p.status === "failed" || p.status === "locked");

                // Check if ALL parents are done -> Node becomes AVAILABLE (if it was locked)
                const parentsDone = parents.every(p => p.status === "done");

                let newStatus = node.status;

                if (parentFailed) {
                    newStatus = "locked";
                } else if (parentsDone && node.status === "locked") {
                    newStatus = "available";
                } else if (!parentFailed && !parentsDone && node.status === "available") {
                    // If parents aren't done anymore (reverted), lock it back? 
                    // Strict logic: If not all parents done, you can't be available/enrolled unless strictly overridden.
                    // For simplicity: If parents not done, lock.
                    newStatus = "locked";
                }

                if (newStatus !== node.status) {
                    hasChanged = true;
                    return { ...node, status: newStatus };
                }
                return node;
            });
        }
        return computedNodes;
    };

    const resetSimulation = () => {
        setNodes(INITIAL_NODES);
    };

    return (
        <div className="relative w-full h-[600px] bg-[#050510] rounded-[2.5rem] border border-white/10 overflow-hidden group shadow-2xl">
            {/* Inner Glint */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 backdrop-blur-sm" />

            {/* Simulation Toolbar */}
            <div className="absolute top-6 left-6 z-20 flex gap-3">
                <button
                    onClick={() => setSimulationMode(!simulationMode)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all border ${simulationMode
                        ? "bg-bio/20 border-bio/50 text-bio shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                        }`}
                >
                    <PlayCircle size={18} />
                    {simulationMode ? "Simulation Active" : "Enable Simulation"}
                </button>

                {simulationMode && (
                    <button
                        onClick={resetSimulation}
                        className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
            </div>

            {simulationMode && (
                <div className="absolute top-6 right-6 z-20 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs shadow-xl">
                    <p className="font-bold mb-2 ml-1 text-white/60 tracking-wider">CLICK TO CYCLE:</p>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-2 text-white/80"><div className="w-2.5 h-2.5 rounded-full bg-bio shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Done</span>
                        <span className="flex items-center gap-2 text-white/80"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Failed</span>
                    </div>
                </div>
            )}

            {/* Edges (SVG Layer) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {nodes.map((node) =>
                    node.dependsOn.map((parentId) => {
                        const parent = nodes.find(n => n.id === parentId);
                        if (!parent) return null;

                        const isGray = parent.status === "failed" || parent.status === "locked";
                        const isActive = !isGray && node.status !== "locked";

                        return (
                            <motion.line
                                key={`${parentId}-${node.id}`}
                                x1={`${parent.x}%`}
                                y1={`${parent.y}%`}
                                x2={`${node.x}%`}
                                y2={`${node.y}%`}
                                stroke={isGray ? "#333" : isActive ? "rgba(59, 130, 246, 0.4)" : "rgba(255,255,255,0.1)"}
                                strokeWidth={isActive ? "3" : "2"}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1 }}
                            />
                        );
                    })
                )}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
                <TreeNode
                    key={node.id}
                    node={node}
                    onClick={() => handleNodeClick(node.id)}
                    simulationMode={simulationMode}
                />
            ))}
        </div>
    );
}

function TreeNode({ node, onClick, simulationMode }: { node: TreeNode, onClick: () => void, simulationMode: boolean }) {
    const config = {
        done: {
            styles: "border-bio/50 bg-bio/10 text-bio",
            icon: Check,
            glow: "shadow-[0_0_30px_rgba(34,197,94,0.2)]"
        },
        enrolled: {
            styles: "border-ember/50 bg-ember/10 text-ember",
            icon: Clock,
            glow: "shadow-[0_0_30px_rgba(249,115,22,0.2)]"
        },
        failed: {
            styles: "border-red-500/50 bg-red-500/10 text-red-500",
            icon: AlertCircle,
            glow: "shadow-[0_0_30px_rgba(239,68,68,0.2)]"
        },
        locked: {
            styles: "border-white/5 bg-white/5 text-white/20 grayscale",
            icon: Lock,
            glow: ""
        },
        available: {
            styles: "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40",
            icon: Lock,
            glow: "shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        },
    };

    const current = config[node.status];
    const Icon = current.icon;

    return (
        <motion.div
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            layout
            onClick={onClick}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-36 h-12 rounded-full border backdrop-blur-md flex items-center justify-between px-4 transition-all z-10 
            ${current.styles} ${current.glow} ${simulationMode ? "cursor-pointer hover:scale-105" : ""}`}
        >
            <span className="font-bold text-xs truncate max-w-[80%]">{node.label}</span>
            <div className={`p-1 rounded-full ${node.status === 'locked' ? 'bg-white/5' : ''}`}>
                <Icon size={14} />
            </div>

            {/* Simulation Badge Animation */}
            {simulationMode && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-ping opacity-30" />
            )}
        </motion.div>
    );
}
