export default function BrainPage() {
  return null;
}

// "use client";

// import { motion } from "framer-motion";
// import {
//   ArrowLeft,
//   BookOpen,
//   FileText,
//   Youtube,
//   Brain,
//   Layers,
//   Star,
//   PlayCircle,
//   Sparkles,
//   Upload,
// } from "lucide-react";
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { useState } from "react";

// export default function BrainPage() {
//   const params = useParams();
//   const courseId = params.id as string;
//   const [activeTab, setActiveTab] = useState<
//     "content" | "flashcards" | "videos" | "extra"
//   >("content");

//   return (
//     <div className="min-h-screen bg-background px-6 py-12 mt-20 md:mt-0 relative overflow-hidden text-foreground">
//       {/* Background Glow */}
//       <div className="fixed right-0 top-0 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />

//       <div className="max-w-7xl mx-auto relative z-10">
//         {/* Header */}
//         <div className="mb-12">
//           <Link
//             href={`/course/${courseId}`}
//             className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4"
//           >
//             <ArrowLeft className="w-4 h-4" /> Back to Course
//           </Link>
//           <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
//             <Brain className="text-purple-400 w-10 h-10" />
//             Course Brain
//           </h1>
//           <p className="text-white/60 text-lg max-w-2xl">
//             Your AI study companion. Upload materials to generate flashcards,
//             get video recommendations, and track your mastery.
//           </p>
//         </div>

//         {/* Navigation Tabs */}
//         <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-1">
//           <TabButton
//             active={activeTab === "content"}
//             onClick={() => setActiveTab("content")}
//             icon={Layers}
//             label="Content Engine"
//           />
//           <TabButton
//             active={activeTab === "flashcards"}
//             onClick={() => setActiveTab("flashcards")}
//             icon={FileText}
//             label="Flashcards"
//           />
//           <TabButton
//             active={activeTab === "videos"}
//             onClick={() => setActiveTab("videos")}
//             icon={Youtube}
//             label="Video Tutor"
//           />
//           <TabButton
//             active={activeTab === "extra"}
//             onClick={() => setActiveTab("extra")}
//             icon={Sparkles}
//             label="Go Deeper"
//           />
//         </div>

//         {/* Content Area */}
//         <div className="min-h-[400px]">
//           {activeTab === "content" && <ContentEngineTab />}
//           {activeTab === "flashcards" && <FlashcardsTab />}
//           {activeTab === "videos" && <VideoTutorTab />}
//           {activeTab === "extra" && <ExtraCurricularTab />}
//         </div>
//       </div>
//     </div>
//   );
// }

// function TabButton({
//   active,
//   onClick,
//   icon: Icon,
//   label,
// }: {
//   active: boolean;
//   onClick: () => void;
//   icon: any;
//   label: string;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl border-b-2 transition-all font-medium ${
//         active
//           ? "border-purple-500 text-white bg-white/5"
//           : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
//       }`}
//     >
//       <Icon className={`w-4 h-4 ${active ? "text-purple-400" : ""}`} />
//       {label}
//     </button>
//   );
// }

// // --- TAB COMPONENTS (Placeholders for now) ---

// function ContentEngineTab() {
//   return (
//     <div className="grid md:grid-cols-2 gap-8">
//       {/* Upload Section */}
//       <div className="space-y-6">
//         <div className="p-8 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 hover:border-purple-500/50 transition-colors text-center group cursor-pointer">
//           <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
//             <Upload className="w-8 h-8 text-white/40 group-hover:text-purple-400" />
//           </div>
//           <h3 className="text-xl font-bold mb-2">Upload Slides & Sheets</h3>
//           <p className="text-white/40">
//             Drop your Professor's PDF slides or Problem Sheets here.
//           </p>
//         </div>

//         <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
//           <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
//             <BookOpen className="text-blue-400" />
//             Reference Textbook
//           </h3>
//           <div className="flex gap-2">
//             <input
//               placeholder="Enter Textbook Name (e.g. Calculus by Stewart)"
//               className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
//             />
//             <button className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold transition-colors">
//               Set
//             </button>
//           </div>
//           <p className="text-white/30 text-sm mt-3">
//             Or upload a PDF if you have it. The AI uses this to "Prune" reading
//             lists.
//           </p>
//         </div>
//       </div>

//       {/* Status Section */}
//       <div className="space-y-4">
//         <h3 className="text-xl font-bold text-white/60">Knowledge Base</h3>
//         <div className="p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center justify-center h-[300px] text-center">
//           <Layers className="w-12 h-12 text-white/20 mb-4" />
//           <p className="text-white/40">No materials uploaded yet.</p>
//           <p className="text-white/20 text-sm">
//             Upload slides to activate the Content Engine.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FlashcardsTab() {
//   return (
//     <div className="text-center py-20">
//       <FileText className="w-16 h-16 text-white/10 mx-auto mb-6" />
//       <h2 className="text-2xl font-bold text-white/60">Flashcard Generator</h2>
//       <p className="text-white/40 max-w-md mx-auto mt-2">
//         Upload slides in the "Content Engine" tab first. <br />
//         Values: "Active Recall", "Spaced Repetition".
//       </p>
//     </div>
//   );
// }

// function VideoTutorTab() {
//   return (
//     <div className="text-center py-20">
//       <Youtube className="w-16 h-16 text-white/10 mx-auto mb-6" />
//       <h2 className="text-2xl font-bold text-white/60">AI Video Tutor</h2>
//       <p className="text-white/40 max-w-md mx-auto mt-2">
//         We will find the best YouTube videos for your specific topics. <br />
//         Coming soon: "Timestamped Explanations".
//       </p>
//     </div>
//   );
// }

// function ExtraCurricularTab() {
//   return (
//     <div className="text-center py-20">
//       <Sparkles className="w-16 h-16 text-white/10 mx-auto mb-6" />
//       <h2 className="text-2xl font-bold text-white/60">"Go Deeper"</h2>
//       <p className="text-white/40 max-w-md mx-auto mt-2">
//         Love this subject? We'll build a career & project roadmap for you.
//       </p>
//     </div>
//   );
// }
