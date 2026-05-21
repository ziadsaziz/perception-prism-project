import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";

export const Route = createFileRoute("/_app/patterns")({ component: Patterns });

function Patterns() {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("patterns").select("*").eq("user_id", user.id).order("frequency", { ascending: false }),
      supabase.from("scans").select("scan_type, ai_summary, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
    ]).then(([p, s]) => { setPatterns(p.data ?? []); setScans(s.data ?? []); });
  }, [user]);

  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror Memory</p>
        <h1 className="font-display text-3xl text-gradient mt-1">Patterns.</h1>
        <p className="mt-2 text-sm text-muted-foreground">The things you repeat without knowing.</p>
      </header>

      {patterns.length === 0 ? (
        <GlassPanel className="p-6">
          <p className="font-display text-lg text-gradient">Mirror is still learning you.</p>
          <p className="mt-2 text-sm text-muted-foreground">Patterns emerge after 3–5 scans. The more Mirror sees, the sharper the memory.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-2.5">
          {patterns.map((p: any) => (
            <GlassPanel key={p.id} className="p-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">
                  Detected pattern · {p.frequency} {p.frequency === 1 ? "time" : "times"}
                </p>
                <h3 className="mt-2 font-display text-xl text-gradient">{p.pattern_name}</h3>
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{p.pattern_description}</p>
              </div>

              {p.evidence && (
                <div className="pt-3 border-t border-border/40">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">Evidence</p>
                  <p className="text-sm text-foreground/70 leading-relaxed">{p.evidence}</p>
                </div>
              )}

              {p.impact && (
                <div className="pt-3 border-t border-border/40">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">How it lands</p>
                  <p className="text-sm text-foreground/70 leading-relaxed">{p.impact}</p>
                </div>
              )}

              {p.fix && (
                <div className="pt-3 border-t border-border/40">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C] mb-1">The shift</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{p.fix}</p>
                </div>
              )}

              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">
                Last seen · {new Date(p.last_seen).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </GlassPanel>
          ))}
        </div>
      )}

      {scans.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Recent reads</p>
          <div className="mt-2 space-y-2">
            {scans.map((s, i) => (
              <div key={i} className="bg-glass ring-hairline rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-accent">{s.scan_type.replace("_", " ")}</p>
                <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">{s.ai_summary ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
