import { Sparkles } from "lucide-react";

export function ExtraCurricularTab() {
    return (
        <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground/60">"Go Deeper"</h2>
            <p className="text-foreground/40 max-w-md mx-auto mt-2">
                Love this subject? We'll build a career & project roadmap for you.
            </p>
        </div>
    );
}
