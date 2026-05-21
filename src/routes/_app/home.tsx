import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateDailyRead } from "@/lib/ai.functions";
import { ScoreRing } from "@/components/ScoreRing";
import { MirrorMemory } from "@/components/MirrorMemory";
import { GlassPanel } from "@/components/GlassPanel";
import { ScanLine, Image as ImageIcon, Mic, Sparkles, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/home")({ component: Home });

type Scores = {
  perception_score: number; confidence_score: number; attraction_score: number;
  authority_score: number; approachability_score: number; authenticity_score: number;
  emotional_control_score: number; mystery_score: number;
};

function Home() {
  const { user } = useAuth();
  const dailyFn = useServerFn(generateDailyRead);
  const [profile, setProfile] = useState<any>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [daily, setDaily] = useState<{ read: string; mission: string; early?: boolean; isNew?: boolean } | null>(null);
  const [pattern, setPattern] = useState<any>(null);
  const [loadingRead, setLoadingRead] = useState(false);
  const [scanCount, setScanCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, pat, sc] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("perception_scores").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("patterns").select("*").eq("user_id", user.id).order("last_seen", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("scans").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);
      setProfile(p.data);
      setScores(s.data as any);
      setPattern(pat.data);
      setScanCount(sc.count ?? 0);
    })();
  }, [user]);

  const fetchDaily = async () => {
    setLoadingRead(true);
    try { setDaily(await dailyFn({} as any)); } finally { setLoadingRead(false); }
  };

  useEffect(() => { if (profile) fetchDaily(); /* once */ // eslint-disable-next-line
  }, [profile?.user_id]);

  const hasScores = scanCount > 0;

  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Today</p>
          <h1 className="font-display text-2xl text-gradient mt-1">{profile?.name ? `Welcome back, ${profile.name}.` : "Welcome back."}</h1>
        </div>
        <div className="h-9 w-9 rounded-full bg-glass ring-hairline flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse-soft" />
        </div>
      </header>

      <GlassPanel glow className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read · today</p>
          {daily?.isNew && (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] uppercase tracking-[0.28em] text-accent">New</span>
            </div>
          )}
        </div>
        {loadingRead || !daily ? (
          <div className="mt-3 h-16 rounded-md animate-shimmer" />
        ) : (
          <>
            <p className="mt-3 font-display text-[22px] leading-snug text-gradient">{daily.read}</p>
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/40">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">The move</p>
                <p className="text-sm text-foreground/90 mt-1">{daily.mission}</p>
              </div>
            </div>
            {daily.early && (
              <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">Early read · Mirror gets sharper as it sees more</p>
            )}
          </>
        )}
      </GlassPanel>

      <section>
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Perception scores</p>
          {hasScores && (
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#C9A84C]">
              {scanCount} {scanCount === 1 ? "scan" : "scans"} logged
            </p>
          )}
        </div>
        <GlassPanel className="p-4">
          {hasScores ? (
            <>
              <div className="grid grid-cols-4 gap-3">
                <ScoreRing value={scores!.perception_score} label="Perception" />
                <ScoreRing value={scores!.confidence_score} label="Confidence" />
                <ScoreRing value={scores!.attraction_score} label="Attraction" />
                <ScoreRing value={scores!.emotional_control_score} label="Control" />
                <ScoreRing
                  value={scores!.approachability_score}
                  label="Approach"
                  locked={scanCount < 3}
                />
                <ScoreRing
                  value={scores!.mystery_score}
                  label="Mystery"
                  locked={scanCount < 3}
                />
                <ScoreRing
                  value={scores!.authority_score}
                  label="Authority"
                  locked={scanCount < 5}
                />
                <ScoreRing
                  value={scores!.authenticity_score}
                  label="Authentic"
                  locked={scanCount < 5}
                />
              </div>
              {scanCount < 5 && (
                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                  {scanCount < 3
                    ? `${3 - scanCount} more ${3 - scanCount === 1 ? "scan" : "scans"} to unlock approach & mystery`
                    : `${5 - scanCount} more ${5 - scanCount === 1 ? "scan" : "scans"} to unlock authority & authenticity`}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="grid grid-cols-4 gap-3 w-full opacity-20 blur-[3px] pointer-events-none select-none">
                {[...Array(8)].map((_, i) => (
                  <ScoreRing key={i} value={72} label="——" />
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#C9A84C]">Scores locked</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed max-w-[240px]">
                  Mirror builds your perception profile after your first scan.
                </p>
              </div>
              <Link
                to="/scan"
                search={{ type: "text" }}
                className="rounded-full border border-[#C9A84C]/50 text-[#C9A84C] px-5 py-2.5 text-[11px] uppercase tracking-[0.28em] hover:bg-[#C9A84C]/5 transition-colors"
              >
                Run your first scan
              </Link>
            </div>
          )}
        </GlassPanel>
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Quick scan</p>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <QuickAction to="/scan" search={{ type: "text" }} icon={ScanLine} label="Conversation" sub="Paste or upload" />
          <QuickAction to="/scan" search={{ type: "selfie" }} icon={ImageIcon} label="Selfie" sub="Presence read" />
          <QuickAction to="/scan" search={{ type: "voice" }} icon={Mic} label="Voice note" sub="Energy & tone" />
          <QuickAction to="/advisor" icon={Sparkles} label="Ask Mirror" sub="Strategic session" />
        </div>
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Your current pattern</p>
        <GlassPanel className="mt-2 p-5">
          {pattern ? (
            <>
              <p className="font-display text-lg text-gradient">{pattern.pattern_name}</p>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{pattern.pattern_description}</p>
              <Link to="/patterns" className="mt-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-accent">
                See all patterns <ChevronRight className="h-3 w-3" />
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-lg text-gradient">Patterns emerging.</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Run a few scans. Mirror starts noticing how you actually behave — not how you think you do.</p>
              <Link to="/scan" className="mt-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-accent">
                Start your first scan <ChevronRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </GlassPanel>
      </section>
      <MirrorMemory />
    </main>
  );
}

function QuickAction({ to, search, icon: Icon, label, sub }: any) {
  return (
    <Link to={to} search={search} className="bg-glass ring-hairline rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform">
      <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </Link>
  );
}
