import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";

export const Route = createFileRoute("/_app/evolution")({ component: Evolution });

type ScoreRow = {
  perception_score: number | null;
  confidence_score: number | null;
  attraction_score: number | null;
  authority_score: number | null;
  approachability_score: number | null;
  authenticity_score: number | null;
  emotional_control_score: number | null;
  mystery_score: number | null;
  mirror_score: number | null;
  created_at: string;
};

const METRICS = [
  { key: "perception_score", label: "Perception" },
  { key: "confidence_score", label: "Confidence" },
  { key: "attraction_score", label: "Attraction" },
  { key: "emotional_control_score", label: "Control" },
  { key: "approachability_score", label: "Approachability" },
  { key: "mystery_score", label: "Mystery" },
  { key: "authority_score", label: "Authority" },
  { key: "authenticity_score", label: "Authenticity" },
] as const;

function delta(scores: ScoreRow[], key: keyof ScoreRow): number {
  if (scores.length < 2) return 0;
  const latest = scores[0][key] as number;
  const previous = scores[scores.length - 1][key] as number;
  return latest - previous;
}

function trend(scores: ScoreRow[], key: keyof ScoreRow): number[] {
  return [...scores].reverse().map(s => s[key] as number);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="text-[11px] text-muted-foreground">—</span>
  );
  const positive = value > 0;
  return (
    <span className={`text-[11px] ${positive ? "text-[#C9A84C]" : "text-[#8B0000]"}`}>
      {positive ? "+" : ""}{value}
    </span>
  );
}

function Evolution() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("perception_scores")
        .select("perception_score, confidence_score, attraction_score, authority_score, approachability_score, authenticity_score, emotional_control_score, mystery_score, mirror_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("scans")
        .select("id", { count: "exact" })
        .eq("user_id", user.id),
    ]).then(([s, sc]) => {
      setScores(s.data ?? []);
      setScanCount(sc.count ?? 0);
      setLoading(false);
    });
  }, [user]);

  const latest = scores[0];
  const overallDelta = delta(scores, "perception_score");

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Mirror
        </p>
        <h1 className="font-display text-3xl text-gradient mt-1">
          Evolution.
        </h1>
        <p className="text-[11px] text-muted-foreground/70 mt-2 max-w-[240px] leading-relaxed">
          How your perception has shifted over time.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl glass animate-pulse" />
          ))}
        </div>
      ) : scanCount === 0 ? (
        <GlassPanel glow className="p-8 text-center space-y-3">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Nothing to track yet</p>
          <p className="font-display text-xl text-gradient">Give Mirror something to work with.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Run your first scan. Mirror starts tracking how you shift — score by score, week by week.
          </p>
          <Link
            to="/scan"
            search={{ type: "text" }}
            className="inline-block rounded-full border border-[#C9A84C]/50 text-[#C9A84C] px-5 py-2.5 text-[11px] uppercase tracking-[0.28em] hover:bg-[#C9A84C]/5 transition-colors mt-2"
          >
            Run first scan
          </Link>
        </GlassPanel>
      ) : (
        <>
          {/* Overall score card */}
          {latest && (
            <GlassPanel className="p-5 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">
                    Mirror Score
                  </p>
                  <p className="font-display text-4xl text-gradient mt-1 tabular-nums">
                    {latest.mirror_score ?? 0}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-3">
                    Perception
                  </p>
                  <p className="font-display text-2xl text-foreground/90 mt-1 tabular-nums">
                    {latest.perception_score}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <DeltaBadge value={overallDelta} />
                    <span className="text-[10px] text-muted-foreground/50">
                      since first scan
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]/70">
                    {scanCount} scans
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {scores.length} data points
                  </p>
                </div>
              </div>

              {overallDelta > 0 && (
                <p className="text-[11px] text-foreground/80 leading-relaxed border-t border-border/30 pt-3">
                  Your perception has improved {overallDelta} points since Mirror started watching.
                </p>
              )}
              {overallDelta < 0 && (
                <p className="text-[11px] text-foreground/80 leading-relaxed border-t border-border/30 pt-3">
                  Your perception has dropped {Math.abs(overallDelta)} points. Mirror has noticed a shift — run a scan to understand why.
                </p>
              )}
              {overallDelta === 0 && scores.length > 1 && (
                <p className="text-[11px] text-foreground/80 leading-relaxed border-t border-border/30 pt-3">
                  Your perception has held steady. Consistency is its own signal.
                </p>
              )}
            </GlassPanel>
          )}

          {/* Individual score breakdowns */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">
              Score breakdown
            </p>
            <div className="space-y-1.5">
              {METRICS.map(({ key, label }) => {
                if (!latest) return null;
                const current = latest[key] as number;
                const d = delta(scores, key);
                const trendValues = trend(scores, key);
                const color = current >= 70 ? "#C9A84C" : current >= 45 ? "rgba(255,255,255,0.5)" : "#8B0000";

                return (
                  <GlassPanel key={key} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkline values={trendValues} color={color} />
                      <div>
                        <p className="text-sm text-foreground tabular-nums">
                          {current}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {label}
                        </p>
                      </div>
                    </div>
                    <DeltaBadge value={d} />
                  </GlassPanel>
                );
              })}
            </div>
          </div>

          {/* Mirror insight on evolution */}
          {scores.length >= 3 && latest && (
            <GlassPanel className="p-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]/70 mb-3">
                Mirror&apos;s read on your trajectory
              </p>
              <EvolutionInsight scores={scores} />
            </GlassPanel>
          )}

          {/* Data points timeline */}
          {scores.length > 1 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">
                Score history
              </p>
              <div className="space-y-1.5">
                {scores.slice(0, 8).map((s, i) => (
                  <div key={s.created_at} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl glass">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/40" />
                      <span className="text-[11px] text-muted-foreground/70">
                        {i === 0 ? "Latest" : new Date(s.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className="text-sm text-foreground tabular-nums">
                      {s.perception_score ?? 0}
                      {i < scores.length - 1 && (
                        <span className="text-[10px] text-muted-foreground/40 ml-1.5">
                          {(s.perception_score ?? 0) >= ((scores[i + 1]?.perception_score ?? s.perception_score) ?? 0) ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function EvolutionInsight({ scores }: { scores: ScoreRow[] }) {
  const latest = scores[0];
  const earliest = scores[scores.length - 1];

  const biggest_gain = METRICS.reduce((best, m) => {
    const d = (latest[m.key] as number) - (earliest[m.key] as number);
    return d > best.value ? { label: m.label, value: d } : best;
  }, { label: "", value: -Infinity });

  const biggest_drop = METRICS.reduce((worst, m) => {
    const d = (latest[m.key] as number) - (earliest[m.key] as number);
    return d < worst.value ? { label: m.label, value: d } : worst;
  }, { label: "", value: Infinity });

  return (
    <div className="space-y-2">
      {biggest_gain.value > 0 && (
        <p className="text-[11px] text-foreground/80 leading-relaxed">
          Your {biggest_gain.label} has grown the most — up {biggest_gain.value} points. Mirror has noticed this shift across your recent scans.
        </p>
      )}
      {biggest_drop.value < 0 && (
        <p className="text-[11px] text-foreground/80 leading-relaxed">
          Your {biggest_drop.label} has taken the biggest hit — down {Math.abs(biggest_drop.value)} points. This is worth a scan.
        </p>
      )}
      {biggest_gain.value <= 0 && biggest_drop.value >= 0 && (
        <p className="text-[11px] text-foreground/80 leading-relaxed">
          Your scores have stayed consistent. Mirror is watching for the moment something shifts.
        </p>
      )}
    </div>
  );
}
