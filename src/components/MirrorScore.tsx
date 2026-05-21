import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

type ScoreEntry = {
  mirror_score: number;
  created_at: string;
};

function ScoreArc({ score, prev }: { score: number; prev: number }) {
  const pct = score / 1000;
  const r = 88;
  const cx = 110;
  const cy = 110;
  const startAngle = -210;
  const sweepAngle = 240;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcX = (angle: number) => cx + r * Math.cos(toRad(angle));
  const arcY = (angle: number) => cy + r * Math.sin(toRad(angle));

  const endAngle = startAngle + sweepAngle * pct;

  const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweepAngle)} ${arcY(startAngle + sweepAngle)}`;
  const fillPath = pct > 0
    ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${sweepAngle * pct > 180 ? 1 : 0} 1 ${arcX(endAngle)} ${arcY(endAngle)}`
    : "";

  const delta = score - prev;
  const color = score >= 700 ? "#C9A84C" : score >= 450 ? "rgba(255,255,255,0.7)" : "#8B0000";

  const label =
    score < 300 ? "Calibrating" :
    score < 450 ? "Developing" :
    score < 600 ? "Aware" :
    score < 750 ? "Sharp" :
    score < 900 ? "Commanding" :
    "Elite";

  return (
    <div className="flex flex-col items-center">
      <svg width={220} height={180} viewBox="0 0 220 180" className="overflow-visible">
        <path d={trackPath} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" strokeLinecap="round" />
        {fillPath && (
          <path d={fillPath} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
        )}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="46" fontWeight="300" fill="#fff" className="tabular-nums">
          {score}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fontSize="9" letterSpacing="3" fill="rgba(255,255,255,0.45)">
          MIRROR SCORE
        </text>
      </svg>

      {delta !== 0 && (
        <p className={`-mt-2 text-[11px] ${delta > 0 ? "text-[#C9A84C]" : "text-red-400"}`}>
          {delta > 0 ? `+${delta}` : delta} since last scan
        </p>
      )}

      <div className="mt-2">
        <span className="text-[10px] uppercase tracking-[0.28em]" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function MiniSparkline({ scores }: { scores: ScoreEntry[] }) {
  if (scores.length < 2) return null;
  const vals = [...scores].reverse().map(s => s.mirror_score);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 120;
  const h = 24;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

export function MirrorScore() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="h-56 rounded-2xl glass animate-pulse" />
  );

  const latest = scores[0]?.mirror_score ?? 0;
  const prev = scores[1]?.mirror_score ?? latest;

  if (latest === 0) return (
    <div className="rounded-2xl glass ring-hairline p-6 text-center space-y-3">
      <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Mirror Score</p>
      <p className="font-display text-4xl text-gradient">—</p>
      <p className="text-[12px] text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
        Your Mirror Score unlocks after your first scan. It tracks your overall social and perceptual intelligence over time.
      </p>
      <Link
        to="/scan"
        search={{ type: "text" }}
        className="inline-block rounded-full border border-[#C9A84C]/50 text-[#C9A84C] px-5 py-2.5 text-[11px] uppercase tracking-[0.28em] hover:bg-[#C9A84C]/5 transition-colors mt-2"
      >
        Run first scan
      </Link>
    </div>
  );

  return (
    <div className="rounded-2xl glass ring-hairline p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Mirror Score</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {scores.length} {scores.length === 1 ? "reading" : "readings"}
          </p>
        </div>
      </div>

      <ScoreArc score={latest} prev={prev} />

      {scores.length >= 2 && (
        <div className="flex items-end justify-between pt-3 border-t border-border/30">
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground/60">Trajectory</p>
            <div className="mt-2"><MiniSparkline scores={scores} /></div>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground/60">All-time high</p>
            <p className="font-display text-xl text-[#C9A84C] mt-1 tabular-nums">
              {Math.max(...scores.map(s => s.mirror_score))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
