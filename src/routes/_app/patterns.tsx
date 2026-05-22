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

  const formatInput = (input: string, type: string) => {
    if (!input || input === "[image scan]") return null;
    return input;
  };

  const inputText = formatInput(scan.input_text, scan.scan_type);
  const isImageScan = scan.input_text === "[image scan]";

  return (
    <div className="bg-glass ring-hairline rounded-2xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent">
            {scan.scan_type.replace(/_/g, " ")}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
            {new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed line-clamp-2">
          {result?.read ?? scan.ai_summary ?? "—"}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          {expanded ? "Collapse ↑" : "See full read ↓"}
        </p>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/30 space-y-0">

          {/* Original input */}
          {(inputText || isImageScan) && (
            <div className="px-4 py-3 border-b border-border/20">
              <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                {isImageScan ? "Scan type" : "What you submitted"}
              </p>
              {isImageScan ? (
                <p className="text-[12px] text-white/50 italic">Image / photo scan</p>
              ) : (
                <div className="bg-black/30 rounded-xl px-3 py-2.5 max-h-40 overflow-y-auto">
                  <p className="text-[12px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {inputText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* The Read */}
          {result?.read && (
            <div className="px-4 py-3 border-b border-border/20">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#C9A84C] mb-1.5">The read</p>
              <p className="text-[14px] font-medium text-white leading-snug">{result.read}</p>
            </div>
          )}

          {/* All result fields — dynamically rendered */}
          {[
            { key: "truth", label: "The truth" },
            { key: "what_it_signals", label: "What it signals" },
            { key: "what_is_actually_happening", label: "What's happening" },
            { key: "what_they_actually_feel", label: "What they feel" },
            { key: "their_dominant_pattern", label: "Their pattern" },
            { key: "presence_read", label: "Presence read" },
            { key: "energy_read", label: "Energy read" },
            { key: "first_impression", label: "First impression" },
            { key: "how_it_reads_to_others", label: "How it reads" },
            { key: "what_is_working", label: "What's working" },
          ].filter(f => result?.[f.key]).map(f => (
            <div key={f.key} className="px-4 py-3 border-b border-border/20">
              <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{f.label}</p>
              <p className="text-[13px] text-white/75 leading-relaxed">{result[f.key]}</p>
            </div>
          ))}

          {/* Blind spot */}
          {(result?.blind_spot || result?.their_blind_spot) && (
            <div className="px-4 py-3 border-b border-border/20 bg-red-950/10">
              <p className="text-[9px] uppercase tracking-[0.28em] text-red-400/70 mb-1">Blind spot</p>
              <p className="text-[13px] text-white/80 leading-relaxed">
                {result.blind_spot ?? result.their_blind_spot}
              </p>
            </div>
          )}

          {/* The move */}
          {(result?.the_move || result?.first_move) && (
            <div className="px-4 py-3 bg-[#C9A84C]/5">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#C9A84C] mb-1">The move</p>
              <p className="text-[13px] text-white/90 leading-relaxed">
                {result.the_move ?? result.first_move}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
