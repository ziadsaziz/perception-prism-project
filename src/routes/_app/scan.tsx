import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { analyzeTextConversation } from "@/lib/ai.functions";
import { GlassPanel } from "@/components/GlassPanel";
import { toast } from "sonner";
import { ScanLine, Image as ImageIcon, Mic, Globe, FileText, Heart, Brain, Compass, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/scan")({
  validateSearch: z.object({ type: z.string().optional() }),
  component: Scan,
});

const SCAN_TYPES: Array<{ id: string; title: string; desc: string; icon: any; active?: boolean }> = [
  { id: "text", title: "Text Conversation", desc: "Paste or upload a chat. See what they really felt.", icon: ScanLine, active: true },
  { id: "selfie", title: "Selfie & Presence", desc: "First impression, aura, attraction signals.", icon: ImageIcon },
  { id: "voice", title: "Voice & Energy", desc: "How you sound to others. Charisma map.", icon: Mic },
  { id: "social", title: "Social Profile", desc: "How your profile lands. Status read.", icon: Globe },
  { id: "post", title: "Post Analysis", desc: "Will this post help you — or expose you?", icon: FileText },
  { id: "dating", title: "Dating Dynamic", desc: "Interest, leverage, attachment, next move.", icon: Heart },
  { id: "emotion", title: "Emotional Pattern", desc: "Detect projection, fear, hidden need.", icon: Brain },
  { id: "decision", title: "Decision Perception", desc: "How this choice makes you look.", icon: Compass },
];

const STAGES = ["Reading tone…", "Detecting emotional imbalance…", "Finding perception shifts…", "Building your Mirror read…"];

function Scan() {
  const { type } = Route.useSearch();

  if (type === "text") return <TextScan />;
  if (type && type !== "text") return <ComingSoon type={type} />;

  return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</p>
        <h1 className="font-display text-3xl text-gradient mt-1">Scan.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Feed Mirror something. It will tell you what the world is reading.</p>
      </header>

      <div className="space-y-2.5">
        {SCAN_TYPES.map(s => (
          <Link key={s.id} to="/scan" search={{ type: s.id }}
            className="block bg-glass ring-hairline rounded-2xl p-4 active:scale-[0.99] transition-transform">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{s.title}</h3>
                  {!s.active && <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted/40">Soon</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function TextScan() {
  const fn = useServerFn(analyzeTextConversation);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (text.trim().length < 10) { toast.error("Mirror needs at least a few lines."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const r = await fn({ data: { conversation: text, context_note: note } });
      setResult(r.result);
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return <TextResult result={result} onReset={() => { setResult(null); setText(""); setNote(""); }} />;

  return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> All scans
      </Link>
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Text · Conversation</p>
        <h1 className="font-display text-3xl text-gradient mt-1">What was actually said?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Paste the messages. Use "Me:" and "Them:" so Mirror can read the dynamic.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{STAGES[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading</p>
        </GlassPanel>
      ) : (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={10} maxLength={8000}
            placeholder={`Me: hey, are we still on for tonight?\nThem: yeah maybe, I'll let you know\nMe: ok lmk asap...`}
            className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none" />
          <input value={note} onChange={e => setNote(e.target.value)} maxLength={500}
            placeholder="One line of context (optional)"
            className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30" />
          <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
            Read this
          </button>
        </>
      )}
    </main>
  );
}

function TextResult({ result, onReset }: { result: any; onReset: () => void }) {
  const [tab, setTab] = useState<"soft" | "confident" | "direct">("confident");
  return (
    <main className="px-5 pt-12 pb-6 space-y-4 animate-fade-up">
      <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> New scan
      </button>
      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The truth</p>
      <h1 className="font-display text-[28px] leading-tight text-gradient">{result.truth}</h1>

      <div className="grid grid-cols-1 gap-2.5 mt-2">
        <Insight label="Power dynamic" body={result.power_dynamic} />
        <Insight label="What they felt" body={result.what_they_felt} />
        <Insight label="What you did right" body={result.what_you_did_right} accent="ok" />
        <Insight label="Where you lost leverage" body={result.where_you_lost_leverage} accent="warn" />
        <Insight label="Blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="Next move" body={result.next_move} accent="ok" />
      </div>

      {result.responses && (
        <GlassPanel className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Best replies</p>
          <div className="mt-3 flex gap-1 bg-surface-2/60 rounded-full p-1">
            {(["soft","confident","direct"] as const).map(k => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-2 text-[10px] uppercase tracking-[0.24em] rounded-full transition-colors ${tab === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                {k}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">{result.responses[tab]}</p>
        </GlassPanel>
      )}
    </main>
  );
}

function Insight({ label, body, accent }: { label: string; body: string; accent?: "ok" | "warn" }) {
  if (!body) return null;
  const color = accent === "ok" ? "text-accent" : accent === "warn" ? "text-crimson/80" : "text-muted-foreground";
  return (
    <div className="bg-glass ring-hairline rounded-2xl p-4">
      <p className={`text-[10px] uppercase tracking-[0.28em] ${color}`}>{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

function ComingSoon({ type }: { type: string }) {
  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> All scans
      </Link>
      <GlassPanel glow className="p-8 text-center mt-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Coming Soon · {type}</p>
        <h1 className="mt-4 font-display text-2xl text-gradient">Mirror is calibrating this read.</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Selfie, voice, and social scans unlock with Mirror Elite. Text scans are live now.</p>
        <Link to="/scan" search={{ type: "text" }} className="mt-6 inline-block rounded-full bg-foreground text-background px-5 py-3 text-xs uppercase tracking-[0.24em]">Run a text scan</Link>
      </GlassPanel>
    </main>
  );
}
