import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { GlassPanel } from "@/components/GlassPanel";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type MemoryEntry = {
  id: string;
  memory_type: string | null;
  memory_text: string;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  onboarding_signal_01: "What you want people to feel",
  onboarding_signal_02: "The reaction you don't understand",
  onboarding_signal_03: "Who you tend to lose",
  onboarding_signal_04: "What you never say out loud",
  baseline_read: "Baseline read",
  pattern: "Detected pattern",
  scan_insight: "Scan insight",
};

function formatType(type: string | null): string {
  const t = type ?? "";
  return TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function MirrorMemory() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("mirror_memory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setMemories(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const count = memories.length;
  const baselineEntry = memories.find(m => m.memory_type === "baseline_read");
  const signals = memories.filter(m => m.memory_type?.startsWith("onboarding_signal") ?? false);
  const insights = memories.filter(m => !(m.memory_type?.startsWith("onboarding") ?? false) && m.memory_type !== "baseline_read");

  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror memory</p>
        {count > 0 && (
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
            {count} {count === 1 ? "observation" : "observations"}
          </p>
        )}
      </div>
      <GlassPanel className="mt-2 p-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center py-4">
            <p className="font-display text-lg text-gradient">Memory empty</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
              Mirror starts building your profile the moment you complete onboarding and run your first scan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Baseline */}
            {baselineEntry && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Baseline</p>
                <Link to="/profile" className="block group">
                  <p className="text-sm text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                    {baselineEntry.memory_text.split("\n")[0]}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                    First read &middot; {new Date(baselineEntry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </Link>
              </div>
            )}

            {/* Signals */}
            {signals.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Calibration signals</p>
                <div className="space-y-2">
                  {signals.map(m => (
                    <div key={m.id} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1 w-1 rounded-full bg-accent/60 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{formatType(m.memory_type)}</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{m.memory_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scan insights */}
            {insights.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Observed patterns</p>
                <div className="space-y-2">
                  {insights.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1 w-1 rounded-full bg-accent/60 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{formatType(m.memory_type)}</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{m.memory_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory depth indicator */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Memory depth</p>
                <p className="text-[10px] text-muted-foreground/70">
                  {count < 5
                    ? "Early calibration — Mirror is still learning you."
                    : count < 10
                    ? "Developing — patterns are starting to emerge."
                    : count < 20
                    ? "Established — Mirror knows how you move."
                    : "Deep — Mirror has a clear picture of who you are."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i < Math.min(Math.floor(count / 5), 4) ? "bg-[#C9A84C]" : "bg-muted-foreground/20"}`} />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  {Math.min(Math.floor(count / 5), 4)}/4
                </p>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>
    </section>
  );
}
