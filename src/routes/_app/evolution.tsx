import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/_app/evolution")({ component: Evolution });

const BADGES = [
  { name: "Less Reactive", unlocked: false },
  { name: "More Confident", unlocked: true },
  { name: "Better Presence", unlocked: false },
  { name: "Cleaner Texting", unlocked: true },
  { name: "Stronger Boundaries", unlocked: false },
  { name: "More Magnetic", unlocked: false },
  { name: "Emotionally Sharper", unlocked: false },
];

function Evolution() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("perception_scores").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(30).then(({ data }) => setHistory(data ?? []));
  }, [user]);

  const first = history[0];
  const latest = history[history.length - 1];
  const delta = (key: string) => first && latest ? (latest[key] as number) - (first[key] as number) : 0;

  const rows = [
    { k: "perception_score", l: "Perception" },
    { k: "confidence_score", l: "Confidence" },
    { k: "attraction_score", l: "Attraction" },
    { k: "authority_score", l: "Authority" },
    { k: "emotional_control_score", l: "Emotional Control" },
  ];

  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Evolution</p>
        <h1 className="font-display text-3xl text-gradient mt-1">Who you're becoming.</h1>
      </header>

      <GlassPanel glow className="p-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-accent">Mirror sees movement</p>
        <p className="mt-3 font-display text-xl text-gradient leading-snug">
          {history.length > 1 ? "Something is shifting. The way you carry yourself is changing." : "Mirror will track every shift. Run scans to see your evolution arc."}
        </p>
      </GlassPanel>

      <div className="space-y-2">
        {rows.map(r => {
          const d = delta(r.k);
          const Icon = d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
          const color = d > 0 ? "text-accent" : d < 0 ? "text-crimson" : "text-muted-foreground";
          return (
            <div key={r.k} className="bg-glass ring-hairline rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm">{r.l}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{latest ? `Now ${latest[r.k]}` : "—"}</p>
              </div>
              <div className={`flex items-center gap-1 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="text-sm tabular-nums">{d > 0 ? "+" : ""}{d}</span>
              </div>
            </div>
          );
        })}
      </div>

      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Badges</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BADGES.map(b => (
            <div key={b.name} className={`rounded-full px-3.5 py-2 text-[11px] tracking-wide ring-hairline ${b.unlocked ? "bg-foreground text-background" : "bg-glass text-muted-foreground"}`}>
              {b.name}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
