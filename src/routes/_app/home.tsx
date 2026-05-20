import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateDailyRead } from "@/lib/ai.functions";
import { ScoreRing } from "@/components/ScoreRing";
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
  const [daily, setDaily] = useState<{ read: string; mission: string } | null>(null);
  const [pattern, setPattern] = useState<any>(null);
  const [loadingRead, setLoadingRead] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, pat] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("perception_scores").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("patterns").select("*").eq("user_id", user.id).order("last_seen", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setProfile(p.data); setScores(s.data); setPattern(pat.data);
    })();
  }, [user]);

  const fetchDaily = async () => {
    setLoadingRead(true);
    try { setDaily(await dailyFn({} as any)); } finally { setLoadingRead(false); }
  };

  useEffect(() => { if (profile) fetchDaily(); /* once */ // eslint-disable-next-line
  }, [profile?.user_id]);

  const s = scores ?? { perception_score: 50, confidence_score: 50, attraction_score: 50, authority_score: 50, approachability_score: 50, authenticity_score: 50, emotional_control_score: 50, mystery_score: 50 };

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
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Today's Read</p>
        {loadingRead || !daily ? (
          <div className="mt-3 h-16 rounded-md animate-shimmer" />
        ) : (
          <>
            <p className="mt-3 font-display text-[22px] leading-snug text-gradient">{daily.read}</p>
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/40">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Today's mission</p>
                <p className="text-sm text-foreground/90 mt-1">{daily.mission}</p>
              </div>
            </div>
          </>
        )}
      </GlassPanel>

      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Perception scores</p>
        <GlassPanel className="mt-2 p-4">
          <div className="grid grid-cols-4 gap-3">
            <ScoreRing value={s.perception_score} label="Perception" />
            <ScoreRing value={s.confidence_score} label="Confidence" />
            <ScoreRing value={s.attraction_score} label="Attraction" />
            <ScoreRing value={s.emotional_control_score} label="Control" />
            <ScoreRing value={s.approachability_score} label="Approach" />
            <ScoreRing value={s.mystery_score} label="Mystery" />
            <ScoreRing value={s.authority_score} label="Authority" />
            <ScoreRing value={s.authenticity_score} label="Authentic" />
          </div>
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
