import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
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
      supabase.from("scans").select("scan_type, ai_summary, result_json, input_text, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
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
        <GlassPanel className="p-6 space-y-3">
          <p className="font-display text-lg text-gradient">Nothing repeated yet.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Patterns emerge after 3–5 scans. Mirror is watching — it just hasn't seen enough to name anything yet.</p>
          <Link
            to="/scan"
            search={{ type: "text" }}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-accent"
          >
            Start your first scan <ChevronRight className="h-3 w-3" />
          </Link>
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
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Scan history</p>
          <div className="space-y-2">
            {scans.map((s: any, i: number) => (
              <ScanHistoryCard key={i} scan={s} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ScanHistoryCard({ scan }: { scan: any }) {
  const [expanded, setExpanded] = useState(false);
  const result = scan.result_json;

  return (
    <div className="bg-glass ring-hairline rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent">
            {scan.scan_type.replace(/_/g, " ")}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
            {new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed line-clamp-2">
          {result?.read ?? scan.ai_summary ?? "—"}
        </p>
        {!expanded && (
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
            Tap to expand
          </p>
        )}
      </button>

      {expanded && result && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
          {result.truth && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">The truth</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{result.truth}</p>
            </div>
          )}
          {result.what_it_signals && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">What it signals</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.what_it_signals}</p>
            </div>
          )}
          {result.blind_spot && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] text-red-400/70 mb-1">Blind spot</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.blind_spot}</p>
            </div>
          )}
          {result.the_move && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] text-accent mb-1">The move</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{result.the_move}</p>
            </div>
          )}
          {result.first_move && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] text-accent mb-1">The move</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{result.first_move}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
