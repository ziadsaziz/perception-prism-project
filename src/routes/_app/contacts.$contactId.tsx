import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  analyzeContactInteraction,
  generateContactDossier,
  whatWouldTheyThink,
  generateContactPredictions,
} from "@/lib/ai.functions";
import { GlassPanel } from "@/components/GlassPanel";
import { Loader2, Brain, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MirrorCard } from "@/components/MirrorCard";

export const Route = createFileRoute("/_app/contacts/$contactId")({ component: ContactDetail });

const MOOD_COLOR: Record<string, string> = {
  Open: "text-green-400/70",
  Guarded: "text-orange-400/70",
  Distant: "text-red-400/70",
  Warm: "text-[#C9A84C]",
  Anxious: "text-orange-400/70",
  Frustrated: "text-red-400/70",
  Testing: "text-blue-400/70",
  Genuine: "text-[#C9A84C]",
};

const SHIFT_COLOR: Record<string, string> = {
  "Getting closer": "text-green-400/70",
  "Pulling away": "text-red-400/70",
  "Testing you": "text-orange-400/70",
  "Stable": "text-white/40",
  "Confused": "text-orange-400/50",
  "Disconnecting": "text-red-400/80",
};

const LAND_COLOR: Record<string, string> = {
  Well: "text-green-400",
  Poorly: "text-red-400",
  Mixed: "text-orange-400",
  "Depends on timing": "text-[#C9A84C]",
  "Better than expected": "text-green-400",
};

type Tab = "scan" | "dossier" | "predict" | "think";

function ContactDetail() {
  const { contactId } = useParams({ from: "/_app/contacts/$contactId" });
  const { user } = useAuth();
  const scanFn = useServerFn(analyzeContactInteraction);
  const dossierFn = useServerFn(generateContactDossier);
  const thinkFn = useServerFn(whatWouldTheyThink);
  const predFn = useServerFn(generateContactPredictions);

  const [contact, setContact] = useState<any>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("scan");

  const [inputText, setInputText] = useState("");
  const [note, setNote] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);

  const [thinkInput, setThinkInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [thinkResult, setThinkResult] = useState<any>(null);

  const [generatingDossier, setGeneratingDossier] = useState(false);
  const [generatingPreds, setGeneratingPreds] = useState(false);

  const STAGES = [
    "Reading this interaction…",
    "Comparing to known patterns…",
    "Checking consistency…",
    "Building the read…",
  ];
  const [stage, setStage] = useState(0);

  const load = async () => {
    if (!user) return;
    const [c, d, s, p] = await Promise.all([
      supabase.from("contacts").select("*").eq("id", contactId).eq("user_id", user.id).maybeSingle(),
      supabase.from("contact_dossier").select("*").eq("contact_id", contactId).maybeSingle(),
      supabase.from("contact_scans").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(20),
      supabase.from("contact_predictions").select("*").eq("contact_id", contactId).is("outcome", null).order("created_at", { ascending: false }).limit(5),
    ]);
    setContact(c.data);
    setDossier(d.data);
    setScans(s.data ?? []);
    setPredictions(p.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [contactId, user]);

  const runScan = async () => {
    if (inputText.trim().length < 10) { toast.error("Add more detail first."); return; }
    setScanning(true); setScanResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await scanFn({ data: { contact_id: contactId, input_text: inputText, context_note: note } }) as any;
      setScanResult(r.result);
      await load();
      try { navigator.vibrate?.(12); } catch {}
      setTimeout(() => { setShowCard(true); try { navigator.vibrate?.([8, 50, 8]); } catch {} }, 800);
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setScanning(false); }
  };

  const runDossier = async () => {
    setGeneratingDossier(true);
    try {
      const result = await dossierFn({ data: { contact_id: contactId } }) as any;
      setDossier(result);
      toast.success(`${contact?.name}'s profile updated.`);
    } catch {
      toast.error("Could not generate profile.");
    } finally { setGeneratingDossier(false); }
  };

  const runThink = async () => {
    if (thinkInput.trim().length < 5) { toast.error("Add what you want to send or do."); return; }
    setThinking(true); setThinkResult(null);
    try {
      const r = await thinkFn({ data: { contact_id: contactId, message_or_action: thinkInput } }) as any;
      setThinkResult(r.result);
    } catch (e: any) {
      toast.error(e.message ?? "Could not predict.");
    } finally { setThinking(false); }
  };

  const runPredictions = async () => {
    setGeneratingPreds(true);
    try {
      const r = await predFn({ data: { contact_id: contactId } }) as any;
      if (r.insufficient_data) {
        toast("Add more interactions first — Mirror needs at least 2 to predict.");
      } else {
        setPredictions(r.predictions ?? []);
        toast.success("Predictions generated.");
      }
    } catch {
      toast.error("Could not generate predictions.");
    } finally { setGeneratingPreds(false); }
  };

  if (loading) return (
    <main className="px-5 pt-12 pb-28 space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-shimmer rounded-2xl" />)}
    </main>
  );

  if (!contact) return (
    <main className="px-5 pt-12 pb-28 space-y-4">
      <Link to="/contacts" className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">← Contacts</Link>
      <p className="text-sm text-muted-foreground">Contact not found.</p>
    </main>
  );

  const initials = contact.name.charAt(0).toUpperCase();
  const scanCount = dossier?.scan_count ?? scans.length;

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <Link to="/contacts" className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">← Contacts</Link>

      <div className="flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center font-display text-[28px] text-white shrink-0"
          style={{ background: contact.avatar_color ?? "#C9A84C" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl text-gradient truncate">{contact.name}</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
            {contact.relationship_type}
            {contact.known_since ? ` · ${contact.known_since}` : ""}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
              {scanCount} {scanCount === 1 ? "interaction" : "interactions"}
            </p>
            {dossier?.relationship_trajectory && dossier.relationship_trajectory !== "Unclear" && (
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#C9A84C]/70">
                {dossier.relationship_trajectory}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {([
          { key: "scan", label: "Scan", icon: MessageSquare },
          { key: "dossier", label: "Profile", icon: Brain },
          { key: "think", label: "Think", icon: Sparkles },
          { key: "predict", label: "Predict", icon: TrendingUp },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[9px] uppercase tracking-[0.2em] transition-colors ${
              tab === t.key
                ? "bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C]"
                : "bg-glass ring-hairline text-muted-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" strokeWidth={1.5} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scan" && (
        <div className="space-y-4">
          {scanResult ? (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setScanResult(null); setInputText(""); setShowCard(false); }}
                  className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground"
                >
                  ← New scan
                </button>
                <button onClick={() => setShowCard(true)} className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">
                  Share ↑
                </button>
              </div>

              {scanResult.relationship_shift && (
                <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-4 py-3">
                  <p className={`text-[11px] uppercase tracking-[0.24em] ${SHIFT_COLOR[scanResult.relationship_shift] ?? "text-white/60"}`}>
                    {scanResult.relationship_shift}
                  </p>
                  {scanResult.shift_reason && (
                    <p className="text-[12px] text-white/60 mt-1 leading-snug">{scanResult.shift_reason}</p>
                  )}
                </div>
              )}

              <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">The read</p>
              <p className="font-display text-2xl text-gradient leading-snug">{scanResult.read}</p>

              <div className="space-y-2.5">
                {[
                  { label: "What they actually feel", body: scanResult.what_they_actually_feel },
                  { label: "Their pattern here", body: scanResult.their_pattern_in_this_interaction },
                  { label: "What they want right now", body: scanResult.what_they_want_right_now },
                  { label: "Your blind spot", body: scanResult.your_blind_spot },
                  { label: "The move", body: scanResult.the_move },
                ].filter(i => i.body).map(item => (
                  <GlassPanel key={item.label} className="p-4">
                    <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">{item.label}</p>
                    <p className="text-[13px] text-foreground/85 leading-relaxed">{item.body}</p>
                  </GlassPanel>
                ))}
              </div>

              {scanResult.mirror_note && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">Added to {contact.name}'s file</p>
                  <p className="text-[12px] text-white/60 italic">"{scanResult.mirror_note}"</p>
                </div>
              )}

              {showCard && scanResult.read && (
                <MirrorCard
                  read={scanResult.read.length > 120 ? scanResult.read.slice(0, 117) + "…" : scanResult.read}
                  score={550}
                  onClose={() => setShowCard(false)}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                  What happened with {contact.name}?
                </p>
                {scanning ? (
                  <GlassPanel glow className="p-8 text-center space-y-3 mt-3">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
                    <p className="font-display text-lg text-gradient animate-pulse-soft">{STAGES[stage]}</p>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Mirror is reading {contact.name}
                    </p>
                  </GlassPanel>
                ) : (
                  <>
                    <textarea
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      rows={8}
                      maxLength={4000}
                      placeholder={`Paste the conversation with ${contact.name}, or describe what happened.\n\nMirror already knows their patterns — this scan will be sharper than a generic text scan.`}
                      className="w-full mt-3 bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                    />
                    {inputText.length > 0 && (
                      <p className="text-center text-[10px] text-muted-foreground/40 mt-1">{inputText.length} / 4000</p>
                    )}
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      maxLength={300}
                      placeholder="Any context? (optional)"
                      className="w-full mt-2 bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                    <button
                      onClick={runScan}
                      disabled={inputText.trim().length < 10}
                      className="w-full mt-3 rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                    >
                      Read this interaction
                    </button>
                  </>
                )}
              </div>

              {scans.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">
                    Interaction history
                  </p>
                  {scans.map(scan => (
                    <div key={scan.id} className="bg-glass ring-hairline rounded-2xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-[9px] uppercase tracking-[0.24em] ${MOOD_COLOR[scan.their_mood] ?? "text-white/30"}`}>
                          {scan.their_mood ?? "—"}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40">
                          {new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <p className="text-[13px] text-white/80 leading-snug">{scan.summary}</p>
                      {scan.relationship_shift && (
                        <p className={`text-[10px] uppercase tracking-[0.2em] mt-1 ${SHIFT_COLOR[scan.relationship_shift] ?? "text-white/30"}`}>
                          {scan.relationship_shift}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "dossier" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Mirror's profile on {contact.name}
            </p>
            <button
              onClick={runDossier}
              disabled={generatingDossier || scans.length === 0}
              className="text-[10px] uppercase tracking-[0.24em] text-accent disabled:opacity-40"
            >
              {generatingDossier ? "Building…" : scans.length === 0 ? "Add interactions first" : "Rebuild"}
            </button>
          </div>

          {!dossier || !dossier.dominant_pattern ? (
            <GlassPanel className="p-6 text-center space-y-3">
              <p className="font-display text-lg text-gradient">Profile not built yet.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scans.length === 0
                  ? `Run at least 2 interactions with ${contact.name}. Mirror will build a complete behavioral profile.`
                  : `Mirror has ${scans.length} interaction${scans.length === 1 ? "" : "s"}. Tap Rebuild to generate the profile.`}
              </p>
              {scans.length >= 2 && (
                <button
                  onClick={runDossier}
                  disabled={generatingDossier}
                  className="rounded-full bg-[#C9A84C] text-black px-6 py-2.5 text-[11px] uppercase tracking-[0.28em] font-medium disabled:opacity-40"
                >
                  {generatingDossier ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Build profile"}
                </button>
              )}
            </GlassPanel>
          ) : (
            <div className="space-y-2.5">
              {dossier.attachment_style && dossier.attachment_style !== "Unclear" && (
                <div className="rounded-2xl border-2 border-[#C9A84C]/30 bg-[#C9A84C]/5 px-5 py-4 space-y-1">
                  <p className="text-[9px] uppercase tracking-[0.32em] text-[#C9A84C]">Attachment style</p>
                  <p className="font-display text-[28px] leading-none text-gradient">{dossier.attachment_style}</p>
                </div>
              )}

              {[
                { label: "Dominant pattern", content: dossier.dominant_pattern },
                { label: "Communication style", content: dossier.communication_style },
                { label: "When interested", content: dossier.when_interested },
                { label: "When pulling away", content: dossier.when_pulling_away },
                { label: "What triggers them", content: dossier.what_triggers_them },
                { label: "What they respond to", content: dossier.what_they_respond_to },
                { label: "Honesty read", content: dossier.honesty_read },
                { label: "What they actually want", content: dossier.what_they_want },
              ].filter(f => f.content).map(f => (
                <div key={f.label} className="bg-glass ring-hairline rounded-2xl px-5 py-4">
                  <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">{f.label}</p>
                  <p className="text-[13px] text-foreground/85 leading-relaxed">{f.content}</p>
                </div>
              ))}

              {dossier.full_profile && (
                <div className="bg-glass ring-hairline rounded-2xl px-5 py-4">
                  <p className="text-[9px] uppercase tracking-[0.28em] text-[#C9A84C] mb-2">Full profile</p>
                  <p className="text-[13px] text-foreground/75 leading-[1.85] whitespace-pre-line">{dossier.full_profile}</p>
                </div>
              )}

              <p className="text-center text-[9px] uppercase tracking-[0.24em] text-muted-foreground/30 pt-1">
                Based on {scanCount} interactions · Updates automatically
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "think" && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">What would {contact.name} think?</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Write a message or describe something you're planning to do. Mirror predicts exactly how {contact.name} would react — based on everything it knows about them.
            </p>
          </div>

          {thinkResult ? (
            <div className="space-y-3 animate-fade-up">
              <button onClick={() => { setThinkResult(null); setThinkInput(""); }} className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                ← Try another
              </button>

              <div className="flex items-center gap-3">
                <p className={`font-display text-[28px] leading-none ${LAND_COLOR[thinkResult.will_it_land] ?? "text-white"}`}>
                  {thinkResult.will_it_land}
                </p>
                {thinkResult.landing_reason && (
                  <p className="text-[12px] text-white/40 leading-snug max-w-[200px]">{thinkResult.landing_reason}</p>
                )}
              </div>

              <div className="space-y-2.5">
                {[
                  { label: `${contact.name}'s reaction`, body: thinkResult.their_reaction },
                  { label: "What they'd actually think", body: thinkResult.what_they_would_think },
                  { label: "What to change", body: thinkResult.what_to_change },
                ].filter(i => i.body).map(item => (
                  <GlassPanel key={item.label} className="p-4">
                    <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">{item.label}</p>
                    <p className="text-[13px] text-foreground/85 leading-relaxed">{item.body}</p>
                  </GlassPanel>
                ))}
              </div>

              {thinkResult.the_optimal_version && (
                <GlassPanel className="p-5 border border-[#C9A84C]/20">
                  <p className="text-[9px] uppercase tracking-[0.28em] text-[#C9A84C] mb-2">Optimal version for {contact.name}</p>
                  <p className="text-[13px] text-white/90 leading-relaxed italic">"{thinkResult.the_optimal_version}"</p>
                </GlassPanel>
              )}

              <p className="text-center text-[9px] uppercase tracking-[0.24em] text-muted-foreground/30">
                Confidence: {thinkResult.confidence} · Based on {scanCount} interactions
              </p>
            </div>
          ) : (
            <>
              {thinking ? (
                <GlassPanel glow className="p-8 text-center space-y-4">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
                  <p className="font-display text-xl text-gradient animate-pulse-soft">
                    Thinking like {contact.name}…
                  </p>
                </GlassPanel>
              ) : (
                <>
                  <textarea
                    value={thinkInput}
                    onChange={e => setThinkInput(e.target.value)}
                    rows={6}
                    maxLength={2000}
                    placeholder={`What do you want to send or do?\n\nExamples:\n"Hey, I've been thinking about you"\n"I'm going to stop texting first for a week"\n"I want to tell them I like them"`}
                    className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                  />

                  {scans.length === 0 && (
                    <p className="text-center text-[11px] text-[#C9A84C]/60 uppercase tracking-[0.2em]">
                      Add interactions first for a sharper prediction
                    </p>
                  )}

                  <button
                    onClick={runThink}
                    disabled={thinkInput.trim().length < 5 || thinking}
                    className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                  >
                    How would {contact.name} react?
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === "predict" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              What Mirror sees coming
            </p>
            <button
              onClick={runPredictions}
              disabled={generatingPreds || scans.length < 2}
              className="text-[10px] uppercase tracking-[0.24em] text-accent disabled:opacity-40"
            >
              {generatingPreds ? "Predicting…" : "Generate"}
            </button>
          </div>

          {predictions.length === 0 ? (
            <GlassPanel className="p-6 text-center space-y-3">
              <p className="font-display text-lg text-gradient">No predictions yet.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scans.length < 2
                  ? `Mirror needs at least 2 interactions with ${contact.name} to start predicting.`
                  : `Mirror has enough data. Tap Generate to see what's coming.`}
              </p>
              {scans.length >= 2 && (
                <button
                  onClick={runPredictions}
                  disabled={generatingPreds}
                  className="rounded-full border border-[#C9A84C]/50 text-[#C9A84C] px-5 py-2.5 text-[11px] uppercase tracking-[0.28em] hover:bg-[#C9A84C]/5 transition-colors disabled:opacity-40"
                >
                  {generatingPreds ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Generate predictions"}
                </button>
              )}
            </GlassPanel>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred, i) => (
                <div key={pred.id ?? i} className="bg-glass ring-hairline rounded-2xl overflow-hidden">
                  <div className="px-5 pt-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] uppercase tracking-[0.24em] text-[#C9A84C]/70">{pred.timeframe}</p>
                      <p className="text-[9px] text-muted-foreground/30">#{i + 1}</p>
                    </div>
                    <p className="font-display text-[18px] leading-snug text-gradient">{pred.prediction}</p>
                    {pred.reasoning && (
                      <p className="text-[12px] text-white/50 leading-relaxed">{pred.reasoning}</p>
                    )}
                  </div>
                  <div className="border-t border-white/[0.05] px-5 py-3 flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground/40">Did this happen?</p>
                    <div className="flex gap-3">
                      {(["correct", "partially", "incorrect"] as const).map(o => (
                        <button
                          key={o}
                          onClick={async () => {
                            await supabase.from("contact_predictions").update({ outcome: o, verified_at: new Date().toISOString() }).eq("id", pred.id);
                            setPredictions(prev => prev.filter(p => p.id !== pred.id));
                            toast.success(o === "correct" ? "Mirror was right." : o === "partially" ? "Partially right." : "Mirror missed this one.");
                          }}
                          className={`text-[10px] uppercase tracking-[0.2em] ${
                            o === "correct" ? "text-green-400/70 hover:text-green-400" :
                            o === "partially" ? "text-[#C9A84C]/70 hover:text-[#C9A84C]" :
                            "text-red-400/70 hover:text-red-400"
                          } transition-colors`}
                        >
                          {o === "correct" ? "Yes" : o === "partially" ? "Partly" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
