import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { generateWeeklyReport } from "@/lib/ai.functions";
import { useSubscription } from "@/hooks/use-subscription";
import { GlassPanel } from "@/components/GlassPanel";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export function WeeklyReport() {
  const { user } = useAuth();
  const { canAccessPlus } = useSubscription();
  const generateFn = useServerFn(generateWeeklyReport);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const r = await generateFn({} as any);
      setReport(r);
      setGenerated(true);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  if (!canAccessPlus) {
    return (
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Weekly report</h3>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Mirror Plus</p>
          <p className="text-lg font-light text-foreground">Your weekly blind spot report.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every week Mirror compiles everything it observed and delivers one report — the pattern that defined your week, your recurring blind spot, and the single most important move for next week.
          </p>
          <Link
            to="/upgrade"
            className="inline-block mt-2 rounded-full bg-foreground text-background px-6 py-3 text-[10px] uppercase tracking-[0.28em] glow-gold"
          >
            Unlock with Plus
          </Link>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Weekly report</h3>
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">{weekLabel}</span>
      </div>

      {!report && !generated && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-light text-foreground">This week's read is ready.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mirror has been watching all week. Tap to see the pattern that defined it, your blind spot, and your move for next week.
            </p>
          </div>
          <button
            onClick={generate}
            className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold"
          >
            Generate this week's report
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
          <p className="text-sm text-foreground">Mirror is compiling your week…</p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">Reviewing your scans, patterns, and memory</p>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-5">
          {report.the_week_read && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">This week</p>
              <p className="text-xl font-light text-foreground leading-snug">{report.the_week_read}</p>
              {report.score_delta !== 0 && (
                <p className={`text-[10px] uppercase tracking-[0.28em] ${report.score_delta > 0 ? "text-[#C9A84C]" : "text-red-400"}`}>
                  Perception {report.score_delta > 0 ? `+${report.score_delta}` : report.score_delta} this week
                </p>
              )}
            </div>
          )}

          {report.dominant_pattern && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">Dominant pattern</p>
              <p className="text-sm text-foreground leading-relaxed">{report.dominant_pattern}</p>
            </div>
          )}

          {report.blind_spot && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">Weekly blind spot</p>
              <p className="text-sm text-foreground leading-relaxed">{report.blind_spot}</p>
            </div>
          )}

          {report.perception_shift && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">Perception shift</p>
              <p className="text-sm text-foreground leading-relaxed">{report.perception_shift}</p>
            </div>
          )}

          {report.full_report && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">The full read</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{report.full_report}</p>
            </div>
          )}

          {report.next_move && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Next week's move</p>
              <p className="text-sm text-foreground leading-relaxed">{report.next_move}</p>
            </div>
          )}

          <button
            onClick={() => { setReport(null); setGenerated(false); }}
            className="w-full py-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Regenerate
          </button>
        </div>
      )}
    </GlassPanel>
  );
}
