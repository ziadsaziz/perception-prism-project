import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { analyzeTextConversation, analyzePost, analyzeEmotionalPattern } from "@/lib/ai.functions";
import { GlassPanel } from "@/components/GlassPanel";
import { MirrorCard } from "@/components/MirrorCard";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useSubscription } from "@/hooks/use-subscription";
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
  { id: "post", title: "Post Analysis", desc: "Will this post help you — or expose you?", icon: FileText, active: true },
  { id: "dating", title: "Dating Dynamic", desc: "Interest, leverage, attachment, next move.", icon: Heart },
  { id: "emotion", title: "Emotional Pattern", desc: "Detect projection, fear, hidden need.", icon: Brain, active: true },
  { id: "decision", title: "Decision Perception", desc: "How this choice makes you look.", icon: Compass },
];

const STAGES = ["Reading tone…", "Detecting pressure points…", "Finding the pattern…", "Separating behavior from emotion…", "Building your Mirror read…"];

function Scan() {
  const { type } = Route.useSearch();

  if (type === "text") return <TextScan />;
  if (type === "post") return <PostScan />;
  if (type === "emotion") return <EmotionScan />;
  if (type && !["text", "post", "emotion"].includes(type)) return <ComingSoon type={type} />;

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
  const { canScan, plan, scansRemaining } = useSubscription();
  const fn = useServerFn(analyzeTextConversation);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);


  const run = async () => {
    if (text.trim().length < 10) { toast.error("Mirror needs at least a few lines."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const r = await fn({ data: { conversation: text, context_note: note } });
      setResult(r.result);
      // Show mirror card after scan completes
      if (r.result?.scores?.perception) {
        setCardScore(r.result.scores.perception);
        setTimeout(() => setShowCard(true), 800);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return (
    <>
      <TextResult
        result={result}
        onReset={() => { setResult(null); setText(""); setNote(""); setShowCard(false); }}
        onShare={() => setShowCard(true)}
      />
      {showCard && result.read && (
        <MirrorCard
          read={result.read.length > 120 ? result.read.slice(0, 117) + "…" : result.read}
          score={cardScore}
          onClose={() => setShowCard(false)}
        />
      )}
    </>
  );

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
          {!canScan && <UpgradePrompt reason="scan_limit" currentPlan={plan} />}

          {canScan && (
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

          {canScan && scansRemaining !== Infinity && (
            <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
              {scansRemaining} {scansRemaining === 1 ? "scan" : "scans"} remaining this month
            </p>
          )}
        </>
      )}
    </main>
  );
}

function TextResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
  return (
    <main className="px-5 pt-12 pb-6 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> New scan
        </button>
        {onShare && (
          <button
            onClick={onShare}
            className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C] hover:opacity-80 transition-opacity"
          >
            Share read ↑
          </button>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[28px] leading-tight text-gradient whitespace-pre-line">{result.read ?? result.truth}</h1>

      <div className="grid grid-cols-1 gap-2.5 mt-2">
        <Insight label="What shifted" body={result.what_shifted ?? result.power_dynamic} />
        <Insight label="What they likely felt" body={result.what_they_likely_felt ?? result.what_they_felt} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The move" body={result.move ?? result.next_move} accent="ok" />
      </div>

      {result.optional_response && (
        <GlassPanel className="p-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Optional response</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{result.optional_response}</p>
        </GlassPanel>
      )}

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads patterns, not destiny
      </p>
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

const PLATFORMS = ["Instagram", "LinkedIn", "X / Twitter", "TikTok", "Facebook", "Other"];

const LANDING_COLOR: Record<string, string> = {
  Strong: "text-[#C9A84C]",
  Neutral: "text-white/60",
  Risky: "text-orange-400",
  Overexposed: "text-red-400",
};

function PostScan() {
  const { canScan, plan } = useSubscription();
  const fn = useServerFn(analyzePost);
  const [text, setText] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);

  const run = async () => {
    if (text.trim().length < 5) { toast.error("Paste the post first."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const r = await fn({ data: { post_text: text, platform, context_note: note } });
      setResult(r.result);
      if (r.result?.scores?.perception) {
        setCardScore(r.result.scores.perception);
        setTimeout(() => setShowCard(true), 800);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return (
    <>
      <PostResult result={result} onReset={() => { setResult(null); setText(""); setShowCard(false); }} onShare={() => setShowCard(true)} />
      {showCard && result.read && (
        <MirrorCard
          read={result.read.length > 120 ? result.read.slice(0, 117) + "…" : result.read}
          score={cardScore}
          onClose={() => setShowCard(false)}
        />
      )}
    </>
  );

  return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> All scans
      </Link>
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Post · Analysis</p>
        <h1 className="font-display text-3xl text-gradient mt-1">Will this land?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Paste your post. Mirror reads what it signals before you hit publish.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{STAGES[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading</p>
        </GlassPanel>
      ) : (
        <>
          {!canScan && <UpgradePrompt reason="scan_limit" currentPlan={plan} />}
          {canScan && (
            <>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                      platform === p
                        ? "bg-[#C9A84C] text-black"
                        : "bg-glass ring-hairline text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                maxLength={3000}
                placeholder="Paste your caption, tweet, LinkedIn post, or anything you're about to put out there…"
                className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
              />
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="Any context? (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />
              <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
                Read this post
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function PostResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
  return (
    <main className="px-5 pt-12 pb-6 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> New scan
        </button>
        {onShare && (
          <button onClick={onShare} className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">
            Share read ↑
          </button>
        )}
      </div>

      {result.how_it_lands && (
        <div className="flex items-center gap-3">
          <span className={`font-display text-[32px] leading-none ${LANDING_COLOR[result.how_it_lands] ?? "text-white"}`}>
            {result.how_it_lands}
          </span>
          {result.landing_reason && (
            <p className="text-[12px] text-white/50 leading-snug max-w-[200px]">{result.landing_reason}</p>
          )}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="What it signals" body={result.what_it_signals} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The move" body={result.the_move} accent="ok" />
      </div>

      {result.stronger_version && (
        <GlassPanel className="p-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C] mb-3">Stronger version</p>
          <p className="text-sm leading-relaxed text-white/90 italic">"{result.stronger_version}"</p>
        </GlassPanel>
      )}

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads signals, not intent
      </p>
    </main>
  );
}

const FEELINGS = ["Anxious", "Frustrated", "Invisible", "Misunderstood", "Drained", "Disconnected", "Angry", "Numb"];
const FREQUENCIES = ["Just happened", "Once a week", "All the time", "Always in this situation"];

function EmotionScan() {
  const { canScan, plan } = useSubscription();
  const fn = useServerFn(analyzeEmotionalPattern);
  const [situation, setSituation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [howOften, setHowOften] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);

  const run = async () => {
    if (situation.trim().length < 10) { toast.error("Tell Mirror what's happening."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const r = await fn({ data: { situation, feeling, how_often: howOften } });
      setResult(r.result);
      if (r.result?.scores?.perception) {
        setCardScore(r.result.scores.perception);
        setTimeout(() => setShowCard(true), 800);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return (
    <>
      <EmotionResult result={result} onReset={() => { setResult(null); setSituation(""); setShowCard(false); }} onShare={() => setShowCard(true)} />
      {showCard && result.read && (
        <MirrorCard
          read={result.read.length > 120 ? result.read.slice(0, 117) + "…" : result.read}
          score={cardScore}
          onClose={() => setShowCard(false)}
        />
      )}
    </>
  );

  return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> All scans
      </Link>
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Emotional · Pattern</p>
        <h1 className="font-display text-3xl text-gradient mt-1">What keeps happening?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Describe the situation. Mirror finds the pattern beneath the feeling.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{STAGES[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading</p>
        </GlassPanel>
      ) : (
        <>
          {!canScan && <UpgradePrompt reason="scan_limit" currentPlan={plan} />}
          {canScan && (
            <>
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                rows={7}
                maxLength={3000}
                placeholder="What's happening? What keeps repeating? Describe it like you'd tell a friend — the situation, what you did, how it went, what you felt after."
                className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
              />

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">What are you feeling?</p>
                <div className="flex flex-wrap gap-2">
                  {FEELINGS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFeeling(feeling === f ? "" : f)}
                      className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        feeling === f
                          ? "bg-[#C9A84C] text-black"
                          : "bg-glass ring-hairline text-muted-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">How often does this happen?</p>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f}
                      onClick={() => setHowOften(howOften === f ? "" : f)}
                      className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        howOften === f
                          ? "bg-white/20 text-white"
                          : "bg-glass ring-hairline text-muted-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
                Find my pattern
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function EmotionResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
  return (
    <main className="px-5 pt-12 pb-6 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> New scan
        </button>
        {onShare && (
          <button onClick={onShare} className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">
            Share read ↑
          </button>
        )}
      </div>

      {result.the_pattern_name && (
        <div className="bg-black/40 border border-[#C9A84C]/20 rounded-2xl px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Pattern detected</p>
          <p className="mt-1 font-display text-[22px] text-gradient">{result.the_pattern_name}</p>
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="What's actually happening" body={result.what_is_actually_happening} />
        <Insight label="The root" body={result.the_root} />
        <Insight label="How others read it" body={result.how_others_read_it} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The move" body={result.the_move} accent="ok" />
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads patterns, not destiny
      </p>
    </main>
  );
}

function ComingSoon({ type }: { type: string }) {
  const { canAccessElite } = useSubscription();

  if (!canAccessElite) {
    return (
      <main className="px-5 pt-12 pb-6 space-y-5">
        <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> All scans
        </Link>
        <UpgradePrompt reason="elite_feature" currentPlan="free" />
      </main>
    );
  }

  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> All scans
      </Link>
      <GlassPanel glow className="p-8 text-center mt-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Coming Soon · {type}</p>
        <h1 className="mt-4 font-display text-2xl text-gradient">Mirror is calibrating this read.</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">This scan type is being built now. You'll be the first to know when it's live.</p>
      </GlassPanel>
    </main>
  );
}
