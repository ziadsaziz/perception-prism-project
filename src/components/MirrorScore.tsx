import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

type ScoreEntry = {
  mirror_score: number;
  created_at: string;
};

const TIER = (s: number) =>
  s < 300 ? "Calibrating" :
  s < 450 ? "Developing" :
  s < 600 ? "Aware" :
  s < 750 ? "Sharp" :
  s < 900 ? "Commanding" : "Elite";

function MiniArc({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(1, score / 1000));
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * 0.75; // 270deg arc
  const fill = dash * pct;
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-[135deg]">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${fill} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

export function MirrorScoreCompact({ score, prev, readings, percentile = 0 }: { score: number; prev: number; readings: number; percentile?: number }) {
  const delta = score - prev;
  const color = score >= 700 ? "#C9A84C" : score >= 450 ? "rgba(255,255,255,0.6)" : "#8B0000";

  return (
    <div className="rounded-2xl glass ring-hairline px-4 py-3 flex items-center gap-4">
      <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
        <MiniArc score={score} color={color} />
        <span className="absolute inset-0 flex items-center justify-center text-sm font-medium tabular-nums text-white">
          {score}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Mirror Score</p>
          {delta !== 0 && (
            <span className={`text-[10px] tabular-nums ${delta > 0 ? "text-[#C9A84C]" : "text-red-400"}`}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          <span style={{ color }}>{TIER(score)}</span>
          <span className="text-muted-foreground/40"> · {readings} {readings === 1 ? "reading" : "readings"}</span>
        </p>
        {percentile > 0 && (
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#C9A84C]/80 mt-1">
            Top {Math.max(1, 100 - percentile)}% of users
          </p>
        )}
      </div>
      <Link to="/evolution" className="text-[10px] uppercase tracking-[0.24em] text-accent shrink-0">
        Evolution →
      </Link>
    </div>
  );
}

export function MirrorScoreLocked() {
  return (
    <div className="rounded-2xl glass ring-hairline px-4 py-3 flex items-center gap-4">
      <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
        <MiniArc score={0} color="rgba(255,255,255,0.2)" />
        <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/40">—</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Mirror Score</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">Unlocks after your first scan</p>
      </div>
      <Link to="/scan" search={{ type: "text" }} className="text-[10px] uppercase tracking-[0.24em] text-accent shrink-0">
        Run scan →
      </Link>
    </div>
  );
}

export function MirrorScore() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentile, setPercentile] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("perception_scores")
      .select("mirror_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setScores(((data ?? []) as ScoreEntry[]).filter(s => (s.mirror_score ?? 0) > 0));
        setLoading(false);
      });
  }, [user]);

  const latest = scores[0]?.mirror_score ?? 0;
  const prev = scores[1]?.mirror_score ?? latest;

  useEffect(() => {
    if (latest === 0) return;
    supabase
      .from("platform_benchmarks")
      .select("*")
      .eq("metric", "mirror_score")
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const bench = data as { p25_value: number; p50_value: number; p75_value: number; p90_value: number };
        let pct = 0;
        if (latest <= bench.p25_value) pct = Math.round((latest / Math.max(1, bench.p25_value)) * 25);
        else if (latest <= bench.p50_value) pct = Math.round(25 + ((latest - bench.p25_value) / Math.max(1, bench.p50_value - bench.p25_value)) * 25);
        else if (latest <= bench.p75_value) pct = Math.round(50 + ((latest - bench.p50_value) / Math.max(1, bench.p75_value - bench.p50_value)) * 25);
        else if (latest <= bench.p90_value) pct = Math.round(75 + ((latest - bench.p75_value) / Math.max(1, bench.p90_value - bench.p75_value)) * 15);
        else pct = Math.min(99, Math.round(90 + ((latest - bench.p90_value) / Math.max(1, bench.p90_value)) * 9));
        setPercentile(pct);
      });
  }, [latest]);

  if (loading) return <div className="h-[68px] rounded-2xl glass animate-pulse" />;

  if (latest === 0) return <MirrorScoreLocked />;

  return <MirrorScoreCompact score={latest} prev={prev} readings={scores.length} percentile={percentile} />;
}
