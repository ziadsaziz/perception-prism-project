import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { generateDossier } from "@/lib/ai.functions";
import { GlassPanel } from "@/components/GlassPanel";
import { useSubscription } from "@/hooks/use-subscription";
import { Loader2, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_app/dossier")({ component: Dossier });

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  "The Performer": "Projects confidence as armor. What's underneath matters more.",
  "The Controller": "Manages situations to feel safe. Control is protection.",
  "The Withdrawer": "Retreats when things get real. Distance is defense.",
  "The Seeker": "Chases validation externally. The answer isn't out there.",
  "The Challenger": "Tests people before trusting them. Not everyone passes.",
  "The Protector": "Puts others first to avoid their own discomfort.",
  "The Mirror": "Reflects what others want to see. Who are you really?",
  "The Ghost": "Disappears when things get hard. Present but absent.",
  "The Architect": "Plans everything. Spontaneity is a threat.",
  "The Empath": "Absorbs everything. Needs better filters.",
};

const CLASS_COLOR: Record<string, string> = {
  "BASIC ACCESS": "text-white/30",
  "STANDARD ACCESS": "text-white/50",
  "ENHANCED ACCESS": "text-[#C9A84C]/70",
  "ELITE CLEARANCE": "text-[#C9A84C]",
};

function DossierSection({ label, content, accent }: { label: string; content: string; accent?: boolean }) {
  return (
    <GlassPanel className="p-5 space-y-2">
      <p className={`text-[10px] uppercase tracking-[0.28em] ${accent ? "text-[#C9A84C]" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground/90">{content}</p>
    </GlassPanel>
  );
}

function Dossier() {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const generateFn = useServerFn(generateDossier);
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadStage, setLoadStage] = useState(0);

  const LOAD_STAGES = [
    "Compiling behavioral data…",
    "Cross-referencing scan history…",
    "Identifying core signal…",
    "Mapping social archetype…",
    "Finalizing dossier…",
  ];

  const generate = async () => {
    setGenerating(true);
    setLoadStage(0);
    const t = setInterval(() => setLoadStage(s => Math.min(s + 1, LOAD_STAGES.length - 1)), 1200);
    try {
      const result = await generateFn({} as any);
      setDossier(result);
    } catch {}
    finally { clearInterval(t); setGenerating(false); }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("dossier")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setDossier(data);
          setLoading(false);
        });
    });
  }, [user]);

  if (loading) return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-glass animate-pulse" />)}
    </main>
  );

  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <Link to="/home" className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ChevronLeft className="h-3 w-3" /> Home
      </Link>

      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</p>
          {dossier?.classification_level && (
            <p className={`text-[9px] uppercase tracking-[0.32em] ${CLASS_COLOR[dossier.classification_level] ?? "text-white/40"}`}>
              ◆ {dossier.classification_level}
            </p>
          )}
        </div>
        <h1 className="font-display text-4xl text-gradient">Dossier.</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Everything Mirror has observed. Compiled. Classified.
        </p>
      </header>

      {generating ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{LOAD_STAGES[loadStage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Mirror is building your profile
          </p>
        </GlassPanel>
      ) : !dossier ? (
        <GlassPanel className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <h2 className="font-display text-xl text-gradient">Dossier not yet compiled</h2>
            <p className="text-sm text-muted-foreground">Mirror needs more data.</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Run at least 3 scans. Mirror will compile a complete behavioral intelligence profile on you.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={generate}
              className="w-full rounded-full bg-foreground text-background py-3 text-xs uppercase tracking-[0.24em] glow-gold"
            >
              Generate my dossier
            </button>
            <Link to="/scan" search={{}} className="block text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Run more scans first
            </Link>
          </div>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Compiled {new Date(dossier.generated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <button onClick={generate} className="text-[10px] uppercase tracking-[0.28em] text-accent">
              Regenerate
            </button>
          </div>

          {dossier.social_archetype && (
            <GlassPanel glow className="p-5 space-y-2 border border-[#C9A84C]/20">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Social archetype</p>
              <h2 className="font-display text-3xl text-gradient">{dossier.social_archetype}</h2>
              {dossier.archetype_description && (
                <p className="text-sm text-foreground/90 leading-relaxed">{dossier.archetype_description}</p>
              )}
              {ARCHETYPE_DESCRIPTIONS[dossier.social_archetype] && (
                <p className="text-[11px] italic text-muted-foreground/70 pt-1">
                  "{ARCHETYPE_DESCRIPTIONS[dossier.social_archetype]}"
                </p>
              )}
            </GlassPanel>
          )}

          {dossier.core_signal && (
            <DossierSection label="Core signal" content={dossier.core_signal} accent />
          )}

          {dossier.dominant_pattern && (
            <DossierSection label="Dominant pattern" content={dossier.dominant_pattern} />
          )}

          {dossier.recurring_blind_spot && (
            <GlassPanel className="p-5 space-y-2 border border-red-900/30">
              <p className="text-[10px] uppercase tracking-[0.28em] text-red-400/80">Recurring blind spot</p>
              <p className="text-sm leading-relaxed text-foreground/90">{dossier.recurring_blind_spot}</p>
            </GlassPanel>
          )}

          {dossier.perception_trajectory && (
            <DossierSection label="Perception trajectory" content={dossier.perception_trajectory} />
          )}

          {dossier.relationship_pattern && (
            <DossierSection label="Relationship pattern" content={dossier.relationship_pattern} />
          )}

          {dossier.strength_profile && (
            <GlassPanel className="p-5 space-y-2 border border-[#C9A84C]/15">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Strength profile</p>
              <p className="text-sm leading-relaxed text-foreground/90">{dossier.strength_profile}</p>
            </GlassPanel>
          )}

          {dossier.risk_profile && (
            <DossierSection label="Risk profile" content={dossier.risk_profile} />
          )}

          {dossier.full_assessment && (
            plan === "elite" ? (
              <GlassPanel className="p-5 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Full assessment</p>
                <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {dossier.full_assessment}
                </div>
              </GlassPanel>
            ) : (
              <GlassPanel className="p-5 space-y-3 relative">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Full assessment</p>
                <div className="text-sm leading-relaxed text-foreground/40 line-clamp-6 blur-[2px] select-none">
                  {dossier.full_assessment}
                </div>
                <div className="pt-2 space-y-2 border-t border-border/40">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Elite feature</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The full assessment is available on Mirror Elite.
                  </p>
                  <Link to="/profile" className="inline-block rounded-full bg-foreground text-background px-4 py-2 text-[10px] uppercase tracking-[0.24em] glow-gold">
                    Unlock Elite
                  </Link>
                </div>
              </GlassPanel>
            )
          )}

          <div className="pt-4 text-center space-y-1">
            <p className="text-[9px] uppercase tracking-[0.32em] text-muted-foreground/50">
              Mirror · Behavioral Intelligence
            </p>
            <p className="text-[9px] uppercase tracking-[0.32em] text-muted-foreground/40">
              Classification: {dossier.classification_level ?? "BASIC ACCESS"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
