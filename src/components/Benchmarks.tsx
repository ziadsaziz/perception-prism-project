import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";

type Benchmark = {
  metric: string;
  avg_value: number;
  p25_value: number;
  p50_value: number;
  p75_value: number;
  p90_value: number;
  sample_count: number;
};

type UserScores = {
  mirror_score: number;
  perception_score: number;
  confidence_score: number;
  attraction_score: number;
  authority_score: number;
  approachability_score: number;
  authenticity_score: number;
  emotional_control_score: number;
  mystery_score: number;
};

const METRIC_LABELS: Record<string, string> = {
  mirror_score: "Mirror Score",
  perception_score: "Perception",
  confidence_score: "Confidence",
  attraction_score: "Attraction",
  authority_score: "Authority",
  approachability_score: "Approachability",
  authenticity_score: "Authenticity",
  emotional_control_score: "Emotional Control",
  mystery_score: "Mystery",
};

function percentileLabel(pct: number): string {
  if (pct >= 90) return "Top 10%";
  if (pct >= 75) return "Top 25%";
  if (pct >= 50) return "Above average";
  if (pct >= 25) return "Below average";
  return "Bottom 25%";
}

function percentileColor(pct: number): string {
  if (pct >= 75) return "text-[#C9A84C]";
  if (pct >= 50) return "text-white/70";
  if (pct >= 25) return "text-white/40";
  return "text-red-400/70";
}

export function estimatePercentile(value: number, benchmark: Benchmark): number {
  if (value <= benchmark.p25_value) {
    return Math.round((value / Math.max(1, benchmark.p25_value)) * 25);
  } else if (value <= benchmark.p50_value) {
    return Math.round(25 + ((value - benchmark.p25_value) / Math.max(1, benchmark.p50_value - benchmark.p25_value)) * 25);
  } else if (value <= benchmark.p75_value) {
    return Math.round(50 + ((value - benchmark.p50_value) / Math.max(1, benchmark.p75_value - benchmark.p50_value)) * 25);
  } else if (value <= benchmark.p90_value) {
    return Math.round(75 + ((value - benchmark.p75_value) / Math.max(1, benchmark.p90_value - benchmark.p75_value)) * 15);
  } else {
    return Math.min(99, Math.round(90 + ((value - benchmark.p90_value) / Math.max(1, benchmark.p90_value)) * 9));
  }
}

function BenchmarkRow({ metric, userValue, benchmark }: {
  metric: string;
  userValue: number;
  benchmark: Benchmark;
}) {
  const pct = estimatePercentile(userValue, benchmark);
  const label = percentileLabel(pct);
  const color = percentileColor(pct);
  const barColor = pct >= 75 ? "#C9A84C" : pct >= 50 ? "rgba(255,255,255,0.4)" : "rgba(139,0,0,0.6)";

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-foreground/90 truncate">{METRIC_LABELS[metric] ?? metric}</p>
        <p className={`text-[10px] uppercase tracking-[0.24em] mt-0.5 ${color}`}>{label}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 w-32">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(2, Math.min(100, pct))}%`,
              backgroundColor: barColor,
              transition: "width 800ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-foreground/80 w-8 text-right">{pct}%</span>
      </div>
    </div>
  );
}

export function Benchmarks() {
  const { user } = useAuth();
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [userScores, setUserScores] = useState<UserScores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("platform_benchmarks").select("*"),
      supabase
        .from("perception_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]).then(([b, s]) => {
      setBenchmarks((b.data ?? []) as Benchmark[]);
      setUserScores((s.data ?? null) as UserScores | null);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  if (!userScores) {
    return (
      <GlassPanel className="p-5 text-center space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">No comparison yet</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Run a scan to see how you compare to other Mirror users.
        </p>
      </GlassPanel>
    );
  }

  const mirrorBench = benchmarks.find(b => b.metric === "mirror_score");
  const mirrorPct = mirrorBench
    ? estimatePercentile(userScores.mirror_score, mirrorBench)
    : 50;

  const metrics: Array<{ metric: string; value: number }> = [
    { metric: "confidence_score", value: userScores.confidence_score },
    { metric: "perception_score", value: userScores.perception_score },
    { metric: "attraction_score", value: userScores.attraction_score },
    { metric: "authority_score", value: userScores.authority_score },
    { metric: "emotional_control_score", value: userScores.emotional_control_score },
    { metric: "authenticity_score", value: userScores.authenticity_score },
    { metric: "mystery_score", value: userScores.mystery_score },
  ].filter(m => m.value > 0);

  return (
    <div className="space-y-4">
      {mirrorBench && userScores.mirror_score > 0 && (
        <GlassPanel className="p-5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">
            Mirror Score ranking
          </p>
          <p className="font-display text-3xl text-gradient tabular-nums">
            Top {Math.max(1, 100 - mirrorPct)}%
          </p>
          <p className="text-[11px] text-foreground/75 leading-relaxed">
            Your Mirror Score of {userScores.mirror_score} is higher than {mirrorPct}% of Mirror users.
            Platform average is {Math.round(mirrorBench.avg_value)}.
          </p>
        </GlassPanel>
      )}

      {metrics.length > 0 && (
        <GlassPanel className="p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground px-1 pb-2">
            Score breakdown vs platform
          </p>
          {metrics.map(({ metric, value }) => {
            const bench = benchmarks.find(b => b.metric === metric);
            if (!bench || value === 0) return null;
            return (
              <BenchmarkRow key={metric} metric={metric} userValue={value} benchmark={bench} />
            );
          })}
        </GlassPanel>
      )}

      <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/50 text-center">
        Compared anonymously against {(mirrorBench?.sample_count ?? 0).toLocaleString()}+ Mirror users
      </p>
    </div>
  );
}
