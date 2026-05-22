import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { generatePredictions, verifyPrediction } from "@/lib/ai.functions";
import { GlassPanel } from "@/components/GlassPanel";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/predictions")({ component: Predictions });

const CATEGORY_COLOR: Record<string, string> = {
  dating: "text-pink-400/70",
  social: "text-blue-400/70",
  career: "text-[#C9A84C]",
  communication: "text-white/50",
  "self-perception": "text-purple-400/70",
};

const TIMEFRAME_URGENCY: Record<string, string> = {
  "This week": "text-red-400/70",
  "Within 2 weeks": "text-orange-400/70",
  "Within a month": "text-[#C9A84C]/70",
  "Within 3 months": "text-white/40",
};

const OUTCOME_COLOR: Record<string, string> = {
  correct: "text-green-400",
  incorrect: "text-red-400",
  partially: "text-[#C9A84C]",
};

interface Prediction {
  id: string;
  prediction: string;
  reasoning?: string | null;
  category: string;
  timeframe: string;
  outcome?: string | null;
  outcome_note?: string | null;
  verified_at?: string | null;
}

function Predictions() {
  const { user } = useAuth();
  const generateFn = useServerFn(generatePredictions);
  const verifyFn = useServerFn(verifyPrediction);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insufficientData, setInsufficientData] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = (await generateFn({} as any)) as any;
      setPredictions(result?.predictions ?? []);
      setInsufficientData(result?.insufficient_data ?? false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setGenerating(true);
    try { await load(); } finally { setGenerating(false); }
  };

  const verify = async (id: string, outcome: "correct" | "incorrect" | "partially", note?: string) => {
    setVerifying(id);
    try {
      await verifyFn({ data: { prediction_id: id, outcome, outcome_note: note } });
      setPredictions(prev => prev.map(p =>
        p.id === id ? { ...p, outcome, outcome_note: note ?? null, verified_at: new Date().toISOString() } : p
      ));
      toast.success(outcome === "correct" ? "Mirror was right." : outcome === "partially" ? "Partially confirmed." : "Mirror missed this one.");
    } catch {
      // ignore
    } finally {
      setVerifying(null);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  return (
    <main className="min-h-screen px-5 pt-6 pb-28 max-w-md mx-auto space-y-6">
      <Link to="/home" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-3 h-3" /> Home
      </Link>

      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Mirror</p>
        <h1 className="text-3xl font-light tracking-tight">Predictions.</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">What Mirror sees coming — based on your patterns.</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading ahead…</p>
        </div>
      ) : insufficientData ? (
        <GlassPanel className="p-8 text-center space-y-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Not enough data yet</p>
          <p className="text-lg text-foreground/85">Mirror needs more to predict.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Run at least 3 scans. Mirror will start forecasting what happens next based on your behavioral patterns.
          </p>
          <Link to="/scan" className="inline-block mt-2 px-5 py-2 rounded-full bg-[#C9A84C]/10 ring-1 ring-[#C9A84C]/30 text-[#C9A84C] text-xs uppercase tracking-[0.24em]">
            Run a scan
          </Link>
        </GlassPanel>
      ) : predictions.length === 0 ? (
        <GlassPanel className="p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">No predictions yet.</p>
          <button onClick={regenerate} disabled={generating} className="px-5 py-2 rounded-full bg-[#C9A84C]/10 ring-1 ring-[#C9A84C]/30 text-[#C9A84C] text-xs uppercase tracking-[0.24em] disabled:opacity-50">
            {generating ? "Generating…" : "Generate predictions"}
          </button>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {predictions.map((pred, i) => (
            <GlassPanel key={pred.id} className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-[0.24em] ${CATEGORY_COLOR[pred.category] ?? "text-muted-foreground"}`}>
                      {pred.category}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className={`text-[10px] uppercase tracking-[0.24em] ${TIMEFRAME_URGENCY[pred.timeframe] ?? "text-muted-foreground"}`}>
                      {pred.timeframe}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">
                    #{i + 1}
                  </span>
                </div>

                <p className="text-base text-foreground leading-snug">{pred.prediction}</p>

                {pred.reasoning && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{pred.reasoning}</p>
                )}

                {pred.outcome && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <p className={`text-[10px] uppercase tracking-[0.24em] ${OUTCOME_COLOR[pred.outcome]}`}>
                      Mirror was {pred.outcome === "correct" ? "right" : pred.outcome === "partially" ? "partially right" : "wrong"}
                    </p>
                    {pred.outcome_note && (
                      <p className="text-xs text-muted-foreground">{pred.outcome_note}</p>
                    )}
                  </div>
                )}
              </div>

              {!pred.outcome && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">Did this happen?</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => verify(pred.id, "correct")}
                      disabled={verifying === pred.id}
                      className="text-[10px] uppercase tracking-[0.2em] text-green-400/70 hover:text-green-400 transition-colors disabled:opacity-40"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => verify(pred.id, "partially")}
                      disabled={verifying === pred.id}
                      className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors disabled:opacity-40"
                    >
                      Partly
                    </button>
                    <button
                      onClick={() => verify(pred.id, "incorrect")}
                      disabled={verifying === pred.id}
                      className="text-[10px] uppercase tracking-[0.2em] text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </GlassPanel>
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">
              Refreshes weekly as patterns evolve
            </p>
            <button onClick={regenerate} disabled={generating} className="text-[10px] uppercase tracking-[0.24em] text-[#C9A84C]/70 hover:text-[#C9A84C] disabled:opacity-40">
              {generating ? "…" : "Refresh"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
