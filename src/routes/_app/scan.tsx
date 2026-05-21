import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { analyzeTextConversation, analyzePost, analyzeEmotionalPattern, analyzeDatingDynamic, analyzeDecision, analyzeSocialProfile } from "@/lib/ai.functions";
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
  { id: "social", title: "Social Profile", desc: "How your profile lands. Status read.", icon: Globe, active: true },
  { id: "post", title: "Post Analysis", desc: "Will this post help you — or expose you?", icon: FileText, active: true },
  { id: "dating", title: "Dating Dynamic", desc: "Interest, leverage, attachment, next move.", icon: Heart, active: true },
  { id: "emotion", title: "Emotional Pattern", desc: "Detect projection, fear, hidden need.", icon: Brain, active: true },
  { id: "decision", title: "Decision Perception", desc: "How this choice makes you look.", icon: Compass, active: true },
];

const STAGES = ["Reading tone…", "Detecting pressure points…", "Finding the pattern…", "Separating behavior from emotion…", "Building your Mirror read…"];

function Scan() {
  const { type } = Route.useSearch();

  if (type === "text") return <TextScan />;
  if (type === "post") return <PostScan />;
  if (type === "emotion") return <EmotionScan />;
  if (type === "dating") return <DatingScan />;
  if (type === "decision") return <DecisionScan />;
  if (type === "social") return <SocialScan />;
  if (type && !["text", "post", "emotion", "dating", "decision", "social"].includes(type)) return <ComingSoon type={type} />;

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

const DYNAMIC_TYPES = [
  "New situationship",
  "Early dating",
  "Established relationship",
  "On a break",
  "After a fight",
  "They went cold",
  "I'm losing interest",
  "It's complicated",
];

const LEVERAGE_COLOR: Record<string, string> = {
  You: "text-[#C9A84C]",
  Them: "text-red-400",
  Equal: "text-white/70",
  Unclear: "text-white/40",
};

const ATTRACTION_COLOR: Record<string, string> = {
  High: "text-[#C9A84C]",
  Moderate: "text-white/70",
  Low: "text-red-400",
  Fading: "text-orange-400",
  Strategic: "text-blue-400",
};

function DatingScan() {
  const { canScan, plan } = useSubscription();
  const fn = useServerFn(analyzeDatingDynamic);
  const [situation, setSituation] = useState("");
  const [dynamicType, setDynamicType] = useState("");
  const [note, setNote] = useState("");
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
      const r = await fn({ data: { situation, dynamic_type: dynamicType, context_note: note } });
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
      <DatingResult result={result} onReset={() => { setResult(null); setSituation(""); setShowCard(false); }} onShare={() => setShowCard(true)} />
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
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Dating · Dynamic</p>
        <h1 className="font-display text-3xl text-gradient mt-1">What's really happening?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Paste the conversation or describe the situation. Mirror reads the dynamic, not the story you're telling yourself.</p>
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
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">What's the situation?</p>
                <div className="flex flex-wrap gap-2">
                  {DYNAMIC_TYPES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDynamicType(dynamicType === d ? "" : d)}
                      className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        dynamicType === d
                          ? "bg-[#C9A84C] text-black"
                          : "bg-glass ring-hairline text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                rows={9}
                maxLength={4000}
                placeholder={`Paste the conversation — or describe what's happening. Be specific. Include what they said, what you said, how they've been acting lately. The more Mirror sees, the sharper the read.\n\nExample: "We've been talking for 3 weeks. They were super into it then went cold after we hung out. Now they reply but with one word answers…"`}
                className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
              />

              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="Anything else Mirror should know? (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
                Read this dynamic
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function DatingResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
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

      <div className="grid grid-cols-2 gap-2">
        {result.who_has_leverage && (
          <div className="bg-black/40 border border-white/[0.06] rounded-2xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Leverage</p>
            <p className={`mt-1 font-display text-[22px] leading-none ${LEVERAGE_COLOR[result.who_has_leverage] ?? "text-white"}`}>
              {result.who_has_leverage}
            </p>
            {result.leverage_reason && (
              <p className="mt-1 text-[11px] text-white/40 leading-snug">{result.leverage_reason}</p>
            )}
          </div>
        )}
        {result.attraction_read && (
          <div className="bg-black/40 border border-white/[0.06] rounded-2xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Attraction</p>
            <p className={`mt-1 font-display text-[22px] leading-none ${ATTRACTION_COLOR[result.attraction_read] ?? "text-white"}`}>
              {result.attraction_read}
            </p>
            {result.attraction_reason && (
              <p className="mt-1 text-[11px] text-white/40 leading-snug">{result.attraction_reason}</p>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="What they likely feel" body={result.what_they_likely_feel} />
        <Insight label="What you're signaling" body={result.what_you_are_doing} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The move" body={result.the_move} accent="ok" />
      </div>

      {result.what_not_to_do && (
        <GlassPanel className="p-4 border border-red-900/30">
          <p className="text-[10px] uppercase tracking-[0.28em] text-red-400/70 mb-1">Do not do this</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.what_not_to_do}</p>
        </GlassPanel>
      )}

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads dynamics, not destiny
      </p>
    </main>
  );
}

const DECISION_TYPES = [
  "Career move",
  "Relationship choice",
  "Public statement",
  "Walking away",
  "Asking for something",
  "Setting a boundary",
  "Taking a risk",
  "Staying put",
];

const VERDICT_COLOR: Record<string, string> = {
  Strong: "text-[#C9A84C]",
  Calculated: "text-blue-400",
  Grounded: "text-green-400",
  Risky: "text-orange-400",
  Reactive: "text-red-400",
  "Weak signal": "text-white/40",
};

function DecisionScan() {
  const { canScan, plan } = useSubscription();
  const fn = useServerFn(analyzeDecision);
  const [decision, setDecision] = useState("");
  const [decisionType, setDecisionType] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);

  const run = async () => {
    if (decision.trim().length < 10) { toast.error("Describe the decision first."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const r = await fn({ data: { decision, decision_type: decisionType, context_note: note } });
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
      <DecisionResult result={result} onReset={() => { setResult(null); setDecision(""); setShowCard(false); }} onShare={() => setShowCard(true)} />
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
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Decision · Perception</p>
        <h1 className="font-display text-3xl text-gradient mt-1">How does this look?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Describe what you're about to do. Mirror reads how it lands on the people watching.</p>
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
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">What kind of decision?</p>
                <div className="flex flex-wrap gap-2">
                  {DECISION_TYPES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDecisionType(decisionType === d ? "" : d)}
                      className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        decisionType === d
                          ? "bg-[#C9A84C] text-black"
                          : "bg-glass ring-hairline text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={decision}
                onChange={e => setDecision(e.target.value)}
                rows={8}
                maxLength={3000}
                placeholder={`Describe what you're about to do — or what you already did. Be specific. Include who's involved, what the situation is, and what you're deciding.\n\nExample: "I'm thinking about quitting my job without another one lined up. My manager has been undermining me for months. I have 3 months savings. I want to take a month off then freelance."`}
                className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
              />

              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="Who are you most worried about how this looks to? (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
                Read this decision
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function DecisionResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
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

      {result.perception_verdict && (
        <div className="flex items-center gap-3">
          <span className={`font-display text-[32px] leading-none ${VERDICT_COLOR[result.perception_verdict] ?? "text-white"}`}>
            {result.perception_verdict}
          </span>
          {result.verdict_reason && (
            <p className="text-[12px] text-white/50 leading-snug max-w-[200px]">{result.verdict_reason}</p>
          )}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="How it reads to others" body={result.how_it_reads_to_others} />
        <Insight label="What it reveals" body={result.what_it_reveals} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The strongest version" body={result.the_strongest_version} accent="ok" />
      </div>

      {result.alternative_read && (
        <GlassPanel className="p-5 border border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40 mb-2">Consider instead</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.alternative_read}</p>
        </GlassPanel>
      )}

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads perception, not outcome
      </p>
    </main>
  );
}

const SOCIAL_PLATFORMS = ["Instagram", "LinkedIn", "X / Twitter", "TikTok", "Dating app", "Other"];

const PROFILE_VERDICT_COLOR: Record<string, string> = {
  Magnetic: "text-[#C9A84C]",
  Credible: "text-blue-400",
  Generic: "text-white/40",
  "Trying too hard": "text-orange-400",
  Underplaying: "text-white/60",
  Confusing: "text-red-400",
};

function SocialScan() {
  const { canScan, plan } = useSubscription();
  const fn = useServerFn(analyzeSocialProfile);
  const [platform, setPlatform] = useState("Instagram");
  const [username, setUsername] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [bio, setBio] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);

  const run = async () => {
    if (bio.trim().length < 1) { toast.error("Paste your bio first."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const r = await fn({ data: { bio, platform, username, follower_count: followerCount, post_description: postDescription, context_note: note } });
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
      <SocialResult result={result} onReset={() => { setResult(null); setBio(""); setShowCard(false); }} onShare={() => setShowCard(true)} />
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
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Social · Profile</p>
        <h1 className="font-display text-3xl text-gradient mt-1">How does your profile land?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Paste your bio and describe your profile. Mirror reads the first impression a stranger gets.</p>
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
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Platform</p>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        platform === p
                          ? "bg-[#C9A84C] text-black"
                          : "bg-glass ring-hairline text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={100}
                  placeholder="@username (optional)"
                  className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
                <input
                  value={followerCount}
                  onChange={e => setFollowerCount(e.target.value)}
                  maxLength={50}
                  placeholder="Followers (optional)"
                  className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Your bio</p>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Paste your bio exactly as it appears on your profile…"
                  className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">What are your posts like?</p>
                <textarea
                  value={postDescription}
                  onChange={e => setPostDescription(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe your content style, aesthetic, what you post about, tone, how often you post…"
                  className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                />
              </div>

              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="What are you trying to achieve with this profile? (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
                Read my profile
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function SocialResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
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

      {result.profile_verdict && (
        <div className="flex items-center gap-3">
          <span className={`font-display text-[32px] leading-none ${PROFILE_VERDICT_COLOR[result.profile_verdict] ?? "text-white"}`}>
            {result.profile_verdict}
          </span>
          {result.verdict_reason && (
            <p className="text-[12px] text-white/50 leading-snug max-w-[200px]">{result.verdict_reason}</p>
          )}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="First impression" body={result.first_impression} />
        <Insight label="What it signals" body={result.what_it_signals} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
      </div>

      {(result.strongest_element || result.weakest_element) && (
        <div className="grid grid-cols-2 gap-2">
          {result.strongest_element && (
            <div className="bg-black/40 border border-[#C9A84C]/20 rounded-2xl px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#C9A84C] mb-1">Strongest</p>
              <p className="text-[12px] text-white/80 leading-snug">{result.strongest_element}</p>
            </div>
          )}
          {result.weakest_element && (
            <div className="bg-black/40 border border-red-900/30 rounded-2xl px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.28em] text-red-400/70 mb-1">Weakest</p>
              <p className="text-[12px] text-white/80 leading-snug">{result.weakest_element}</p>
            </div>
          )}
        </div>
      )}

      <Insight label="The move" body={result.the_move} accent="ok" />

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads signals, not follower counts
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
