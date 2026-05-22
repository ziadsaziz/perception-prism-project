import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { analyzeTextConversation, analyzePost, analyzeEmotionalPattern, analyzeDatingDynamic, analyzeDecision, analyzeSocialProfile, analyzeSelfie, analyzeVoice, analyzeOtherPerson, extractConversationFromScreenshot } from "@/lib/ai.functions";
import { GlassPanel } from "@/components/GlassPanel";
import { MirrorCard } from "@/components/MirrorCard";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { ScanLine, Image as ImageIcon, Mic, Globe, FileText, Heart, Brain, Compass, Loader2, ArrowLeft, Users } from "lucide-react";

function haptic(pattern: number | number[] = 10) {
  try { navigator.vibrate?.(pattern); } catch {}
}

export const Route = createFileRoute("/_app/scan")({
  validateSearch: z.object({ type: z.string().optional() }),
  component: Scan,
});

const SCAN_TYPES: Array<{ id: string; title: string; desc: string; icon: any; active?: boolean }> = [
  { id: "other", title: "Read Someone Else", desc: "What they actually feel. What they want. Are they honest.", icon: Users, active: true },
  { id: "text", title: "Text Conversation", desc: "Paste or upload a chat. See what they really felt.", icon: ScanLine, active: true },
  { id: "selfie", title: "Selfie & Presence", desc: "First impression, aura, attraction signals.", icon: ImageIcon, active: true },
  { id: "voice", title: "Voice & Energy", desc: "Speech patterns. How you communicate.", icon: Mic, active: true },
  { id: "social", title: "Social Profile", desc: "How your profile lands. Status read.", icon: Globe, active: true },
  { id: "post", title: "Post Analysis", desc: "Will this post help you — or expose you?", icon: FileText, active: true },
  { id: "dating", title: "Dating Dynamic", desc: "Interest, leverage, attachment, next move.", icon: Heart, active: true },
  { id: "emotion", title: "Emotional Pattern", desc: "Detect projection, fear, hidden need.", icon: Brain, active: true },
  { id: "decision", title: "Decision Perception", desc: "How this choice makes you look.", icon: Compass, active: true },
];

const SCAN_STAGES: Record<string, string[]> = {
  text: [
    "Reading the tone…",
    "Detecting what's underneath the words…",
    "Finding the pressure points…",
    "Separating behavior from emotion…",
    "Building your Mirror read…",
  ],
  post: [
    "Reading the signal this post sends…",
    "Measuring how it lands on a stranger…",
    "Detecting what it reveals about you…",
    "Finding the blind spot…",
    "Writing your read…",
  ],
  emotion: [
    "Reading the emotional pattern…",
    "Finding what's underneath the feeling…",
    "Detecting the root…",
    "Measuring how this lands on others…",
    "Building your Mirror read…",
  ],
  dating: [
    "Reading the dynamic…",
    "Measuring leverage…",
    "Detecting what's not being said…",
    "Reading what they likely feel…",
    "Writing your read…",
  ],
  decision: [
    "Reading how this decision lands…",
    "Measuring the signal it sends…",
    "Detecting what it reveals about you…",
    "Finding the strongest version…",
    "Writing your read…",
  ],
  social: [
    "Reading your profile as a stranger would…",
    "Measuring the first impression…",
    "Detecting what it signals about you…",
    "Finding what's costing you…",
    "Writing your read…",
  ],
  selfie: [
    "Reading your presence…",
    "Measuring confidence signals…",
    "Detecting what you're projecting…",
    "Finding the blind spot…",
    "Writing your read…",
  ],
  voice: [
    "Reading your energy…",
    "Measuring pace and pressure…",
    "Detecting hesitation patterns…",
    "Finding what your delivery signals…",
    "Writing your read…",
  ],
};

const STAGES = SCAN_STAGES.text;

function Scan() {
  const { type } = Route.useSearch();

  if (type === "text") return <TextScan />;
  if (type === "post") return <PostScan />;
  if (type === "emotion") return <EmotionScan />;
  if (type === "dating") return <DatingScan />;
  if (type === "decision") return <DecisionScan />;
  if (type === "social") return <SocialScan />;
  if (type === "selfie") return <SelfieScan />;
  if (type === "voice") return <VoiceScan />;
  if (type === "other") return <OtherPersonScan />;
  if (type && !["text", "post", "emotion", "dating", "decision", "social", "selfie", "voice", "other"].includes(type)) return <ComingSoon type={type} />;

  return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</p>
        <h1 className="font-display text-3xl text-gradient mt-1">Scan.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Feed Mirror something. It will tell you what the world is reading.</p>
      </header>

      <div className="space-y-3">
        {/* Hero scans — featured two */}
        <div className="grid grid-cols-1 gap-2">
          {SCAN_TYPES.filter(s => ["other", "text"].includes(s.id)).map(s => (
            <Link key={s.id} to="/scan" search={{ type: s.id }}
              className="block bg-glass ring-hairline rounded-2xl p-5 border border-[#C9A84C]/20 active:scale-[0.99] transition-transform glow-gold">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-[#C9A84C]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">{s.title}</h3>
                    {s.id === "other" && (
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#C9A84C] px-1.5 py-0.5 rounded-full border border-[#C9A84C]/30">New</span>
                    )}
                    {s.id === "text" && (
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#C9A84C] px-1.5 py-0.5 rounded-full border border-[#C9A84C]/30">Most used</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Elite scans — 2 column grid */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Elite scans</p>
          <div className="grid grid-cols-2 gap-2">
            {SCAN_TYPES.filter(s => ["selfie", "voice"].includes(s.id)).map(s => (
              <Link key={s.id} to="/scan" search={{ type: s.id }}
                className="bg-glass ring-hairline rounded-2xl p-4 active:scale-[0.99] transition-transform">
                <div className="h-8 w-8 rounded-xl bg-secondary/60 flex items-center justify-center mb-3">
                  <s.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium leading-tight">{s.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                <span className="mt-2 inline-block text-[9px] uppercase tracking-[0.2em] text-accent/60 border border-accent/20 rounded-full px-1.5 py-0.5">Elite</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Standard scans — list */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">All scans</p>
          <div className="space-y-2">
            {SCAN_TYPES.filter(s => ["post", "dating", "emotion", "decision", "social"].includes(s.id)).map(s => (
              <Link key={s.id} to="/scan" search={{ type: s.id }}
                className="block bg-glass ring-hairline rounded-2xl p-4 active:scale-[0.99] transition-transform">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium">{s.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    {s.id === "social" && (
                      <span className="mt-1.5 inline-block text-[9px] uppercase tracking-[0.2em] text-accent/60 border border-accent/20 rounded-full px-1.5 py-0.5">Elite</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

type InputMode = "paste" | "builder" | "screenshot";

type Message = {
  id: string;
  sender: "me" | "them";
  text: string;
};

function TextScan() {
  const { canScan, plan } = useSubscription();
  const fn = useServerFn(analyzeTextConversation);
  const extractFn = useServerFn(extractConversationFromScreenshot);

  const [mode, setMode] = useState<InputMode>("paste");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [newSender, setNewSender] = useState<"me" | "them">("them");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const extractFromScreenshot = async () => {
    if (!imageBase64) return;
    setExtracting(true);
    try {
      const result = await extractFn({ data: { image_base64: imageBase64 } });
      setText((result as any).text ?? "");
      setMode("paste");
      toast.success("Conversation extracted. Review and edit if needed.");
    } catch (e: any) {
      toast.error(e.message ?? "Could not extract conversation.");
    } finally {
      setExtracting(false);
    }
  };

  const addMessage = () => {
    if (!newMsg.trim()) return;
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      sender: newSender,
      text: newMsg.trim(),
    }]);
    setNewMsg("");
    setNewSender(s => s === "them" ? "me" : "them");
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const toggleSender = (id: string) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, sender: m.sender === "me" ? "them" : "me" } : m
    ));
  };

  const buildConversationText = () => {
    return messages.map(m => `${m.sender === "me" ? "Me" : "Them"}: ${m.text}`).join("\n");
  };

  const getInputText = () => {
    if (mode === "builder") return buildConversationText();
    return text;
  };

  const canRun = () => {
    if (mode === "builder") return messages.length >= 2;
    return text.trim().length >= 10;
  };

  const run = async () => {
    const inputText = getInputText();
    if (!canRun()) { toast.error("Add more to the conversation first."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, SCAN_STAGES.text.length - 1)), 900);
    try {
      const r = await fn({ data: { conversation: inputText, context_note: note } });
      setResult(r.result);
      haptic(12);
      const ms = r.result?.scores ? Math.min(1000, Math.round((
        (r.result.scores.perception ?? 50) * 0.20 +
        (r.result.scores.confidence ?? 50) * 0.15 +
        (r.result.scores.attraction ?? 50) * 0.13 +
        (r.result.scores.authority ?? 50) * 0.12 +
        (r.result.scores.approachability ?? 50) * 0.10 +
        (r.result.scores.authenticity ?? 50) * 0.12 +
        (r.result.scores.emotional_control ?? 50) * 0.10 +
        (r.result.scores.mystery ?? 50) * 0.08
      ) * 10)) : 0;
      setCardScore(ms);
      setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return (
    <>
      <TextResult
        result={result}
        onReset={() => { setResult(null); setText(""); setMessages([]); setImageBase64(null); setImagePreview(null); setShowCard(false); }}
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
        <h1 className="font-display text-3xl text-gradient mt-1">What really happened?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Paste, build, or screenshot a conversation. Mirror reads what they actually felt.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{SCAN_STAGES.text[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading</p>
        </GlassPanel>
      ) : (
        <>
          {!canScan && <UpgradePrompt reason="scan_limit" currentPlan={plan} />}
          {canScan && (
            <>
              {/* Mode selector */}
              <div className="flex gap-2">
                {([
                  { key: "paste", label: "Paste" },
                  { key: "builder", label: "Build" },
                  { key: "screenshot", label: "Screenshot" },
                ] as const).map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex-1 rounded-full py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                      mode === m.key
                        ? "bg-foreground text-background"
                        : "bg-glass ring-hairline text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* PASTE MODE */}
              {mode === "paste" && (
                <div className="space-y-2">
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={10}
                    maxLength={4000}
                    placeholder={`Paste the conversation here.\n\nTip: Format it like this for the sharpest read:\n\nMe: hey are you free tonight?\nThem: maybe, why?\nMe: wanted to talk\nThem: about what`}
                    className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                  />
                  {text.length > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground/40">{text.length} / 4000</p>
                  )}
                  {text.length > 0 && text.length < 80 && (
                    <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                      Mirror reads sharper with more context
                    </p>
                  )}
                </div>
              )}

              {/* BUILDER MODE */}
              {mode === "builder" && (
                <div className="space-y-3">
                  {messages.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex items-start gap-2 ${m.sender === "me" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`flex-1 rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed max-w-[80%] ${
                              m.sender === "me"
                                ? "bg-white/[0.12] text-white ml-auto"
                                : "bg-white/[0.05] text-white/80"
                            }`}
                          >
                            <p className={`text-[9px] uppercase tracking-[0.2em] mb-1 ${
                              m.sender === "me" ? "text-[#C9A84C]/60 text-right" : "text-white/30"
                            }`}>
                              {m.sender === "me" ? "Me" : "Them"}
                            </p>
                            {m.text}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => toggleSender(m.id)}
                              className="text-[8px] uppercase tracking-[0.15em] text-white/20 hover:text-white/50 transition-colors"
                            >
                              flip
                            </button>
                            <button
                              onClick={() => removeMessage(m.id)}
                              className="text-[8px] uppercase tracking-[0.15em] text-red-400/30 hover:text-red-400/70 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {messages.length === 0 && (
                    <div className="bg-glass ring-hairline rounded-2xl p-5 text-center space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Build the conversation</p>
                      <p className="text-[12px] text-muted-foreground/60">Add messages one by one below</p>
                    </div>
                  )}

                  <div className="bg-glass ring-hairline rounded-2xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewSender("me")}
                        className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition-colors ${
                          newSender === "me"
                            ? "bg-[#C9A84C] text-black"
                            : "bg-white/[0.06] text-muted-foreground"
                        }`}
                      >
                        Me
                      </button>
                      <button
                        onClick={() => setNewSender("them")}
                        className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition-colors ${
                          newSender === "them"
                            ? "bg-white/20 text-white"
                            : "bg-white/[0.06] text-muted-foreground"
                        }`}
                      >
                        Them
                      </button>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 self-center ml-1">
                        is saying:
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addMessage(); }}
                        placeholder="Type message and press Enter…"
                        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 focus:outline-none"
                      />
                      <button
                        onClick={addMessage}
                        disabled={!newMsg.trim()}
                        className="text-[10px] uppercase tracking-[0.2em] text-accent disabled:opacity-30"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {messages.length >= 2 && (
                    <p className="text-center text-[10px] text-muted-foreground/40">
                      {messages.length} messages · Tap "flip" to switch sender
                    </p>
                  )}
                </div>
              )}

              {/* SCREENSHOT MODE */}
              {mode === "screenshot" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="screenshot-upload"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />

                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Screenshot"
                          className="w-full max-h-64 object-cover rounded-2xl"
                        />
                        <button
                          onClick={() => { setImageBase64(null); setImagePreview(null); }}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 flex items-center justify-center text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <button
                        onClick={extractFromScreenshot}
                        disabled={extracting}
                        className="w-full rounded-full bg-foreground text-background py-3.5 text-[11px] uppercase tracking-[0.24em] disabled:opacity-40"
                      >
                        {extracting ? "Extracting conversation…" : "Extract conversation"}
                      </button>

                      {extracting && (
                        <p className="text-center text-[11px] text-muted-foreground animate-pulse">
                          Mirror is reading your screenshot…
                        </p>
                      )}
                    </div>
                  ) : (
                    <label
                      htmlFor="screenshot-upload"
                      className="block w-full border-2 border-dashed border-white/[0.12] rounded-2xl p-10 text-center cursor-pointer hover:border-[#C9A84C]/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="h-14 w-14 rounded-2xl bg-white/[0.04] mx-auto flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white/30" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[14px] text-white/60">Upload a screenshot</p>
                          <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                            iMessage, WhatsApp, Instagram DMs,<br />Snapchat, Tinder, any platform
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mt-2">JPG, PNG · Max 8MB</p>
                        </div>
                      </div>
                    </label>
                  )}

                  <GlassPanel className="p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground leading-relaxed">
                      Mirror extracts the conversation from your screenshot and analyzes it. The image is never stored.
                    </p>
                  </GlassPanel>
                </div>
              )}

              {/* Context note */}
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="Any context? Who is this, what's the situation… (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              {mode !== "screenshot" && (
                <button
                  onClick={run}
                  disabled={!canRun()}
                  className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                >
                  Read this
                </button>
              )}
            </>
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
        {result.what_is_working && (
          <Insight label="What's working" body={result.what_is_working} accent="ok" />
        )}
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
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { post_text: text, platform, context_note: note } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
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
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.post)[stage]}</p>
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
              <div className="space-y-2">
                {text.length > 0 && text.length < 80 && (
                  <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                    Mirror reads sharper with more context
                  </p>
                )}
                {text.length > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground/40">
                    {text.length} / 3000
                  </p>
                )}
                <button
                  onClick={run}
                  disabled={text.trim().length < 10}
                  className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                >
                  Read this post
                </button>
              </div>
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
        {result.what_is_working && (
          <Insight label="What's working" body={result.what_is_working} accent="ok" />
        )}
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
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { situation, feeling, how_often: howOften } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
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
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.emotion)[stage]}</p>
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

              <div className="space-y-2">
                {situation.length > 0 && situation.length < 80 && (
                  <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                    Mirror reads sharper with more context
                  </p>
                )}
                {situation.length > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground/40">
                    {situation.length} / 3000
                  </p>
                )}
                <button
                  onClick={run}
                  disabled={situation.trim().length < 10}
                  className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                >
                  Find my pattern
                </button>
              </div>
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
        {result.what_is_working && (
          <Insight label="What's working" body={result.what_is_working} accent="ok" />
        )}
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
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { situation, dynamic_type: dynamicType, context_note: note } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
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
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.dating)[stage]}</p>
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

              <div className="space-y-2">
                {situation.length > 0 && situation.length < 80 && (
                  <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                    Mirror reads sharper with more context
                  </p>
                )}
                {situation.length > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground/40">
                    {situation.length} / 4000
                  </p>
                )}
                <button
                  onClick={run}
                  disabled={situation.trim().length < 10}
                  className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                >
                  Read this dynamic
                </button>
              </div>
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

      {(result.who_has_leverage || result.attraction_read) && (
        <div className={`grid gap-2 ${result.who_has_leverage && result.attraction_read ? "grid-cols-2" : "grid-cols-1"}`}>
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
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="What they likely feel" body={result.what_they_likely_feel} />
        <Insight label="What you're signaling" body={result.what_you_are_doing} />
        {result.what_is_working && (
          <Insight label="What's working" body={result.what_is_working} accent="ok" />
        )}
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
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { decision, decision_type: decisionType, context_note: note } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
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
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.decision)[stage]}</p>
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

              <div className="space-y-2">
                {decision.length > 0 && decision.length < 80 && (
                  <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                    Mirror reads sharper with more context
                  </p>
                )}
                {decision.length > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground/40">
                    {decision.length} / 3000
                  </p>
                )}
                <button
                  onClick={run}
                  disabled={decision.trim().length < 10}
                  className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                >
                  Read this decision
                </button>
              </div>
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
        {result.what_is_working && (
          <Insight label="What's working" body={result.what_is_working} accent="ok" />
        )}
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
  const { canAccessElite, plan, canTrialSocial, trialScans } = useSubscription();
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
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { bio, platform, username, follower_count: followerCount, post_description: postDescription, context_note: note } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
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
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.social)[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading</p>
        </GlassPanel>
      ) : (
        <>
          {!canAccessElite && !canTrialSocial && (
            <UpgradePrompt reason="elite_feature" currentPlan={plan} />
          )}
          {(canAccessElite || canTrialSocial) && (
            <>
              {!canAccessElite && !trialScans.social && (
                <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl px-4 py-3 mb-2">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Free trial scan</p>
                  <p className="text-[12px] text-white/60 mt-0.5">You have 1 free Social Profile scan. Mirror Elite unlocks unlimited access.</p>
                </div>
              )}
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

              <div className="space-y-2">
                {bio.length > 0 && bio.length < 80 && (
                  <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                    Mirror reads sharper with more context
                  </p>
                )}
                {bio.length > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground/40">
                    {bio.length} / 2000
                  </p>
                )}
                <button
                  onClick={run}
                  disabled={bio.trim().length < 10}
                  className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
                >
                  Read my profile
                </button>
              </div>
            </>
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
        {result.what_is_working && (
          <Insight label="What's working" body={result.what_is_working} accent="ok" />
        )}
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
      </div>

      {(result.strongest_element || result.weakest_element) && (
        <div className={`grid gap-2 ${result.strongest_element && result.weakest_element ? "grid-cols-2" : "grid-cols-1"}`}>
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

const PRESENCE_VERDICT_COLOR: Record<string, string> = {
  Commanding: "text-[#C9A84C]",
  Warm: "text-amber-300",
  Guarded: "text-white/50",
  Uncertain: "text-white/40",
  Magnetic: "text-[#C9A84C]",
  "Closed off": "text-red-400",
  Approachable: "text-green-400",
  Intense: "text-blue-400",
};

function SelfieScan() {
  const { canScan, plan, canAccessElite, canTrialSelfie, trialScans } = useSubscription();
  const fn = useServerFn(analyzeSelfie);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      setImagePreview(res);
      setImageBase64(res.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const run = async () => {
    if (!imageBase64) { toast.error("Upload a photo first."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { image_base64: imageBase64, context_note: note } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return (
    <>
      <SelfieResult
        result={result}
        preview={imagePreview}
        onReset={() => { setResult(null); setImageBase64(null); setImagePreview(null); setShowCard(false); }}
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
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Selfie · Presence</p>
        <h1 className="font-display text-3xl text-gradient mt-1">What do you project?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Upload a photo. Mirror reads the energy, confidence, and presence you project — before you say a word.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.selfie)[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading your presence</p>
        </GlassPanel>
      ) : (
        <>
          {!canAccessElite && !canTrialSelfie && (
            <UpgradePrompt reason="elite_feature" currentPlan={plan} />
          )}
          {(canAccessElite || canTrialSelfie) && (
            <>
              {!canAccessElite && !trialScans.selfie && (
                <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl px-4 py-3 mb-2">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Free trial scan</p>
                  <p className="text-[12px] text-white/60 mt-0.5">You have 1 free Selfie scan. Mirror Elite unlocks unlimited access.</p>
                </div>
              )}
              <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="w-full rounded-2xl ring-hairline object-cover max-h-[420px]" />
                  <button
                    onClick={() => { setImageBase64(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 flex items-center justify-center text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full bg-glass ring-hairline rounded-2xl py-12 flex flex-col items-center justify-center gap-3"
                >
                  <div className="h-12 w-12 rounded-full bg-foreground/5 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground/90">Tap to upload a photo</p>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-1">JPG, PNG · Max 5MB</p>
                  </div>
                </button>
              )}

              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Any context? Where was this taken, what were you going for? (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
              />

              <div className="bg-black/30 border border-foreground/10 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mirror reads presence, energy, and confidence signals — not attractiveness. Your photo is analyzed and never stored. Private by design.
                </p>
              </div>

              <button onClick={run} className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold">
                Read my presence
              </button>
            </>
            </>
          )}
        </>
      )}
    </main>
  );
}

function SelfieResult({ result, preview, onReset, onShare }: { result: any; preview: string | null; onReset: () => void; onShare?: () => void }) {
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

      {preview && (
        <img src={preview} alt="your photo" className="w-full rounded-2xl ring-hairline object-cover max-h-[320px]" />
      )}

      {result.presence_verdict && (
        <div className="flex items-center gap-3">
          <span className={`font-display text-[32px] leading-none ${PRESENCE_VERDICT_COLOR[result.presence_verdict] ?? "text-white"}`}>
            {result.presence_verdict}
          </span>
          {result.verdict_reason && (
            <p className="text-[12px] text-white/50 leading-snug max-w-[220px]">{result.verdict_reason}</p>
          )}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="Presence read" body={result.presence_read} />
        <Insight label="Confidence signals" body={result.confidence_signals} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The move" body={result.the_move} accent="ok" />
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads presence, not appearance
      </p>
    </main>
  );
}

const ENERGY_VERDICT_COLOR: Record<string, string> = {
  Commanding: "text-[#C9A84C]",
  Warm: "text-amber-300",
  Anxious: "text-red-400",
  Confident: "text-[#C9A84C]",
  Hesitant: "text-white/40",
  Overexplaining: "text-orange-400",
  Grounded: "text-green-400",
  Scattered: "text-red-400",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  High: "text-[#C9A84C]",
  Moderate: "text-white/70",
  Low: "text-red-400",
  Performed: "text-orange-400",
};

function VoiceScan() {
  const { canScan, plan, canAccessElite, canTrialVoice, trialScans } = useSubscription();
  const fn = useServerFn(analyzeVoice);
  const [mode, setMode] = useState<"record" | "type">("record");
  const [transcript, setTranscript] = useState("");
  const [vocalDescription, setVocalDescription] = useState("");
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechMetrics, setSpeechMetrics] = useState<any>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausesRef = useRef<Array<number>>([]);
  const fillerCountRef = useRef<number>(0);
  const wordCountRef = useRef<number>(0);
  const volumeSamplesRef = useRef<Array<number>>([]);
  const lastSpeechEndRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const confidenceScoresRef = useRef<Array<number>>([]);
  const finalTranscriptRef = useRef<string>("");
  const volumeIntervalRef = useRef<any>(null);
  const secondsRef = useRef<number>(0);

  const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "right", "so", "okay", "actually", "i mean", "kind of", "sort of"];

  const countFillers = (text: string): number => {
    const lower = text.toLowerCase();
    return FILLER_WORDS.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      return count + (lower.match(regex)?.length ?? 0);
    }, 0);
  };

  const startRecording = async () => {
    const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Recognition) {
      toast("Your browser doesn't support live transcription. Use 'Type transcript' mode.");
      setMode("type");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioContext;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        volumeIntervalRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += Math.abs(dataArray[i] - 128);
          }
          const volume = sum / dataArray.length;
          volumeSamplesRef.current.push(volume);
        }, 200);
      }

      pausesRef.current = [];
      fillerCountRef.current = 0;
      wordCountRef.current = 0;
      volumeSamplesRef.current = [];
      confidenceScoresRef.current = [];
      finalTranscriptRef.current = "";
      lastSpeechEndRef.current = null;
      recordingStartRef.current = Date.now();

      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;
      (recognition as any).active = true;

      let interimText = "";

      recognition.onresult = (event: any) => {
        const now = Date.now() - recordingStartRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const text = r[0].transcript;
          const confidence = r[0].confidence ?? 0.5;

          if (r.isFinal) {
            finalTranscriptRef.current += text + " ";
            confidenceScoresRef.current.push(confidence);

            const words = text.trim().split(/\s+/).filter(Boolean);
            wordCountRef.current += words.length;
            fillerCountRef.current += countFillers(text);

            if (lastSpeechEndRef.current !== null) {
              const pause = now - lastSpeechEndRef.current;
              if (pause > 800) {
                pausesRef.current.push(pause);
              }
            }



            lastSpeechEndRef.current = now;
            interimText = "";
          } else {
            interimText = text;
          }

          setTranscript(finalTranscriptRef.current + interimText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") return;
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied.");
          stopRecording();
        }
      };

      recognition.onend = () => {
        if ((recognition as any).active) {
          try { recognition.start(); } catch {}
        }
      };

      recognition.start();
      setRecording(true);
      setRecorded(false);

      secondsRef.current = 0;
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setRecordingSeconds(secondsRef.current);
        if (secondsRef.current >= 180) stopRecording();
      }, 1000);

    } catch {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      (recognitionRef.current as any).active = false;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    const totalSeconds = secondsRef.current || 1;
    const totalWords = wordCountRef.current;
    const wpm = Math.round((totalWords / totalSeconds) * 60);
    const pauses = pausesRef.current;
    const avgPause = pauses.length > 0 ? Math.round(pauses.reduce((a, b) => a + b, 0) / pauses.length) : 0;
    const longPauses = pauses.filter(p => p > 2000).length;
    const fillers = fillerCountRef.current;
    const fillerRate = totalWords > 0 ? Math.round((fillers / totalWords) * 100) : 0;
    const avgConfidence = confidenceScoresRef.current.length > 0
      ? confidenceScoresRef.current.reduce((a, b) => a + b, 0) / confidenceScoresRef.current.length
      : 0.5;

    const samples = volumeSamplesRef.current;
    let volumeTrend = "stable";
    if (samples.length > 10) {
      const firstThird = samples.slice(0, Math.floor(samples.length / 3));
      const lastThird = samples.slice(Math.floor(samples.length * 2 / 3));
      const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
      const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
      if (avgLast < avgFirst * 0.6) volumeTrend = "trailing off";
      else if (avgLast > avgFirst * 1.4) volumeTrend = "building up";
      else volumeTrend = "stable";
    }

    const fullText = finalTranscriptRef.current;
    const sentences = fullText.split(/[.!?]+/).filter(Boolean);
    const trailingStatements = sentences.filter(s => {
      const words = s.trim().split(" ");
      const lastWord = words[words.length - 1]?.toLowerCase() ?? "";
      return ["right", "okay", "yeah", "no", "though"].includes(lastWord);
    }).length;

    const metrics = {
      duration_seconds: totalSeconds,
      words_per_minute: wpm,
      total_words: totalWords,
      pause_count: pauses.length,
      long_pause_count: longPauses,
      avg_pause_ms: avgPause,
      filler_word_count: fillers,
      filler_rate_percent: fillerRate,
      speech_confidence_avg: Math.round(avgConfidence * 100),
      volume_trend: volumeTrend,
      trailing_statements: trailingStatements,
      sentence_count: sentences.length,
    };

    setSpeechMetrics(metrics);

    const autoParts: string[] = [];
    if (wpm > 160) autoParts.push("spoke very fast");
    else if (wpm < 100) autoParts.push("spoke slowly");
    else autoParts.push(`spoke at ${wpm} words per minute`);

    if (longPauses > 3) autoParts.push(`paused ${longPauses} times for over 2 seconds`);
    else if (pauses.length > 5) autoParts.push(`${pauses.length} noticeable pauses`);

    if (fillerRate > 15) autoParts.push(`heavy filler word use (${fillerRate}% of words)`);
    else if (fillerRate > 7) autoParts.push(`some filler words (${fillerRate}% of words)`);

    if (volumeTrend === "trailing off") autoParts.push("voice trailed off toward the end of sentences");
    if (volumeTrend === "building up") autoParts.push("voice grew stronger through the recording");

    if (avgConfidence < 0.5) autoParts.push("speech recognition had low confidence — possible mumbling or hesitation");

    if (trailingStatements > 2) autoParts.push(`${trailingStatements} statements ended with hedging words`);

    setVocalDescription(autoParts.join(", "));
    setTranscript(finalTranscriptRef.current.trim());
    setRecording(false);
    setRecorded(true);
  };

  const run = async () => {
    if (transcript.trim().length < 10) { toast.error("Mirror needs more to work with."); return; }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const metricsDescription = speechMetrics ? `
Speech behavior metrics (measured by browser):
- Duration: ${speechMetrics.duration_seconds}s
- Speaking pace: ${speechMetrics.words_per_minute} words per minute (normal is 120-150)
- Pauses: ${speechMetrics.pause_count} total, ${speechMetrics.long_pause_count} over 2 seconds
- Average pause length: ${speechMetrics.avg_pause_ms}ms
- Filler words: ${speechMetrics.filler_word_count} (${speechMetrics.filler_rate_percent}% of total words)
- Speech recognition confidence: ${speechMetrics.speech_confidence_avg}% (low = mumbled/hesitant)
- Volume trend: ${speechMetrics.volume_trend}
- Sentences with hedging endings: ${speechMetrics.trailing_statements}
- Total sentences: ${speechMetrics.sentence_count}` : "";

      const fullVocalDescription = [vocalDescription, metricsDescription].filter(Boolean).join("\n");

      const r = await fn({ data: { transcript, vocal_description: fullVocalDescription, context_note: note } });
      setResult(r.result);
      haptic(12);
      if (r.result?.scores?.perception) {
        const ms = r.result?.scores ? Math.min(1000, Math.round((
          (r.result.scores.perception ?? 50) * 0.20 +
          (r.result.scores.confidence ?? 50) * 0.15 +
          (r.result.scores.attraction ?? 50) * 0.13 +
          (r.result.scores.authority ?? 50) * 0.12 +
          (r.result.scores.approachability ?? 50) * 0.10 +
          (r.result.scores.authenticity ?? 50) * 0.12 +
          (r.result.scores.emotional_control ?? 50) * 0.10 +
          (r.result.scores.mystery ?? 50) * 0.08
        ) * 10)) : 0;
        setCardScore(ms);
        setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  const reset = () => {
    setResult(null);
    setTranscript("");
    setRecorded(false);
    setRecordingSeconds(0);
    setSpeechMetrics(null);
    setVocalDescription("");
    setShowCard(false);
    finalTranscriptRef.current = "";
  };

  if (result) return (
    <>
      <VoiceResult result={result} metrics={speechMetrics} onReset={reset} onShare={() => setShowCard(true)} />
      {showCard && result.read && (
        <MirrorCard
          read={result.read.length > 120 ? result.read.slice(0, 117) + "…" : result.read}
          score={cardScore}
          onClose={() => setShowCard(false)}
        />
      )}
    </>
  );

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="px-5 pt-12 pb-6 space-y-4">
      <Link to="/scan" search={{}} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> All scans
      </Link>
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Voice · Energy</p>
        <h1 className="font-display text-3xl text-gradient mt-1">How do you sound?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Mirror measures your pace, pauses, filler words, and volume patterns — not just what you said.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{(SCAN_STAGES.voice)[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading your energy</p>
        </GlassPanel>
      ) : (
        <>
          {!canAccessElite && <UpgradePrompt reason="elite_feature" currentPlan={plan} />}
          {canAccessElite && (
            <>
              <div className="flex gap-2">
                <button onClick={() => { setMode("record"); reset(); }}
                  className={`flex-1 rounded-full py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${mode === "record" ? "bg-foreground text-background" : "bg-glass ring-hairline text-muted-foreground"}`}>
                  Record
                </button>
                <button onClick={() => { setMode("type"); if (recording) stopRecording(); }}
                  className={`flex-1 rounded-full py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${mode === "type" ? "bg-foreground text-background" : "bg-glass ring-hairline text-muted-foreground"}`}>
                  Type transcript
                </button>
              </div>

              {mode === "record" && (
                <GlassPanel className="p-6 space-y-4">
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                        recording ? "bg-red-500 scale-110" : "bg-foreground hover:scale-105"
                      }`}
                    >
                      <Mic className={`h-7 w-7 ${recording ? "text-white" : "text-background"}`} strokeWidth={1.5} />
                    </button>

                    {recording && (
                      <div className="text-center space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-red-400 animate-pulse">
                          Recording — {formatTime(recordingSeconds)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">Speak naturally. Tap to stop.</p>
                      </div>
                    )}

                    {!recording && !recorded && (
                      <div className="text-center space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Tap to start</p>
                        <p className="text-[10px] text-muted-foreground/40">30–90 seconds is ideal</p>
                      </div>
                    )}

                    {recorded && (
                      <div className="text-center space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[#C9A84C]">
                          Captured · {formatTime(recordingSeconds)}
                        </p>
                        <button onClick={reset} className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                          Record again
                        </button>
                      </div>
                    )}
                  </div>

                  {recording && transcript && (
                    <p className="text-[12px] text-white/40 leading-relaxed text-left line-clamp-2 italic border-t border-white/[0.04] pt-3">
                      {transcript}
                    </p>
                  )}

                  {recorded && speechMetrics && (
                    <div className="border-t border-white/[0.06] pt-4 grid grid-cols-3 gap-3">
                      <MetricPill label="Pace" value={`${speechMetrics.words_per_minute} wpm`} flag={speechMetrics.words_per_minute > 170 || speechMetrics.words_per_minute < 90} />
                      <MetricPill label="Pauses" value={`${speechMetrics.pause_count}`} flag={speechMetrics.long_pause_count > 3} />
                      <MetricPill label="Fillers" value={`${speechMetrics.filler_rate_percent}%`} flag={speechMetrics.filler_rate_percent > 10} />
                      <MetricPill label="Volume" value={speechMetrics.volume_trend} flag={speechMetrics.volume_trend === "trailing off"} />
                      <MetricPill label="Confidence" value={`${speechMetrics.speech_confidence_avg}%`} flag={speechMetrics.speech_confidence_avg < 50} />
                      <MetricPill label="Duration" value={formatTime(speechMetrics.duration_seconds)} flag={false} />
                    </div>
                  )}
                </GlassPanel>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                  {mode === "record" ? "Transcript — edit if anything was missed" : "What did you say?"}
                </p>
                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder={mode === "record"
                    ? "Your words appear here as you speak. Include filler words — don't clean it up…"
                    : "Type exactly what you said. Include um's, uh's, pauses — Mirror needs the raw version…"
                  }
                  className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                />
              </div>

              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="What was the context? Pitch, date, difficult convo… (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              <GlassPanel className="p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground leading-relaxed">
                  Mirror measures pace, pauses, filler words, and volume — not just your words. Everything runs on-device. Nothing is uploaded.
                </p>
              </GlassPanel>

              <button
                onClick={run}
                disabled={transcript.trim().length < 10}
                className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
              >
                Read my energy
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function MetricPill({ label, value, flag }: { label: string; value: string; flag: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${flag ? "bg-red-950/30 border border-red-900/30" : "bg-white/[0.03] border border-white/[0.06]"}`}>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`text-[12px] font-medium mt-0.5 ${flag ? "text-red-400" : "text-white/70"}`}>{value}</p>
    </div>
  );
}

function VoiceResult({ result, metrics, onReset, onShare }: { result: any; metrics?: any; onReset: () => void; onShare?: () => void }) {
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

      {(result.energy_verdict || result.confidence_read) && (
      <div className={`grid gap-2 ${result.energy_verdict && result.confidence_read ? "grid-cols-2" : "grid-cols-1"}`}>
        {result.energy_verdict && (
          <div className="bg-black/40 border border-white/[0.06] rounded-2xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Energy</p>
            <p className={`mt-1 font-display text-[20px] leading-none ${ENERGY_VERDICT_COLOR[result.energy_verdict] ?? "text-white"}`}>
              {result.energy_verdict}
            </p>
            {result.verdict_reason && (
              <p className="mt-1 text-[11px] text-white/40 leading-snug">{result.verdict_reason}</p>
            )}
          </div>
        )}
        {result.confidence_read && (
          <div className="bg-black/40 border border-white/[0.06] rounded-2xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Confidence</p>
            <p className={`mt-1 font-display text-[20px] leading-none ${CONFIDENCE_COLOR[result.confidence_read] ?? "text-white"}`}>
              {result.confidence_read}
            </p>
          </div>
        )}
      </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      {metrics && (
        <GlassPanel className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">What Mirror measured</p>
          <div className="grid grid-cols-3 gap-2">
            <MetricPill label="Pace" value={`${metrics.words_per_minute} wpm`} flag={metrics.words_per_minute > 170 || metrics.words_per_minute < 90} />
            <MetricPill label="Pauses" value={`${metrics.pause_count}`} flag={metrics.long_pause_count > 3} />
            <MetricPill label="Fillers" value={`${metrics.filler_rate_percent}%`} flag={metrics.filler_rate_percent > 10} />
            <MetricPill label="Volume" value={metrics.volume_trend} flag={metrics.volume_trend === "trailing off"} />
            <MetricPill label="Confidence" value={`${metrics.speech_confidence_avg}%`} flag={metrics.speech_confidence_avg < 50} />
            <MetricPill label="Duration" value={`${metrics.duration_seconds}s`} flag={false} />
          </div>
        </GlassPanel>
      )}

      <div className="space-y-2.5">
        <Insight label="Energy read" body={result.energy_read} />
        <Insight label="Vocal patterns" body={result.vocal_patterns} />
        <Insight label="Your blind spot" body={result.blind_spot} accent="warn" />
        <Insight label="The move" body={result.the_move} accent="ok" />
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 pt-2">
        Mirror reads delivery, not just words
      </p>
    </main>
  );
}

const RELATIONSHIP_TYPES = [
  "Someone I'm dating",
  "Ex",
  "Friend",
  "Colleague",
  "Boss",
  "Family member",
  "Someone I just met",
  "Public figure",
];

const HONESTY_COLOR: Record<string, string> = {
  Yes: "text-green-400",
  Mostly: "text-[#C9A84C]",
  Selectively: "text-orange-400",
  No: "text-red-400",
  Unclear: "text-white/40",
};

function OtherPersonScan() {
  const { canScan } = useSubscription();
  const fn = useServerFn(analyzeOtherPerson);
  const [inputText, setInputText] = useState("");
  const [personDesc, setPersonDesc] = useState("");
  const [relationship, setRelationship] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardScore, setCardScore] = useState(0);

  const OTHER_STAGES = [
    "Reading their signals…",
    "Detecting what they actually feel…",
    "Finding their dominant pattern…",
    "Measuring their honesty…",
    "Building the read…",
  ];

  const run = async () => {
    if (inputText.trim().length < 10) {
      toast.error("Give Mirror something to read.");
      return;
    }
    setLoading(true); setResult(null); setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, OTHER_STAGES.length - 1)), 900);
    try {
      const r = await fn({ data: { input_text: inputText, person_description: personDesc, relationship, context_note: note } });
      setResult(r.result);
      haptic(12);
      // Calculate a meaningful score from honesty read
      const honestyScores: Record<string, number> = {
        Yes: 780, Mostly: 650, Selectively: 520, No: 380, Unclear: 500
      };
      const honestyScore = honestyScores[r.result?.are_they_being_honest ?? "Unclear"] ?? 500;
      setCardScore(honestyScore);
      setTimeout(() => { setShowCard(true); haptic([8, 50, 8]); }, 800);
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed.");
    } finally { clearInterval(t); setLoading(false); }
  };

  if (result) return (
    <>
      <OtherPersonResult
        result={result}
        onReset={() => { setResult(null); setInputText(""); setShowCard(false); }}
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
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Read · Someone Else</p>
        <h1 className="font-display text-3xl text-gradient mt-1">What are they actually feeling?</h1>
        <p className="mt-2 text-xs text-muted-foreground">Paste their messages, describe their behavior, or share their profile. Mirror reads them — not you.</p>
      </header>

      {loading ? (
        <GlassPanel glow className="p-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
          <p className="mt-5 font-display text-xl text-gradient animate-pulse-soft">{OTHER_STAGES[stage]}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Mirror is reading them</p>
        </GlassPanel>
      ) : (
        <>
          {!canScan && <UpgradePrompt reason="scan_limit" currentPlan="free" />}
          {canScan && (
            <>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Who is this?</p>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_TYPES.map(r => (
                    <button
                      key={r}
                      onClick={() => setRelationship(relationship === r ? "" : r)}
                      className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        relationship === r
                          ? "bg-[#C9A84C] text-black"
                          : "bg-glass ring-hairline text-muted-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={personDesc}
                onChange={e => setPersonDesc(e.target.value)}
                maxLength={500}
                placeholder="Brief description of them — age, personality, how they usually act… (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">What they said or did</p>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  rows={8}
                  maxLength={4000}
                  placeholder={`Paste their messages, describe their behavior, or explain the situation.\n\nThe more Mirror sees, the more accurate the read. Include specific things they said, how they acted, what changed recently.`}
                  className="w-full bg-glass ring-hairline rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
                />
                <div className="space-y-1 mt-2">
                  {inputText.length > 0 && inputText.length < 80 && (
                    <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                      Mirror reads sharper with more context
                    </p>
                  )}
                  {inputText.length > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground/40">
                      {inputText.length} / 4000
                    </p>
                  )}
                </div>
              </div>

              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="What do you want to understand about them? (optional)"
                className="w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />

              <GlassPanel className="p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground leading-relaxed">
                  Mirror reads behavioral signals — not personal data. What you share stays private and is never stored beyond this scan.
                </p>
              </GlassPanel>

              <button
                onClick={run}
                disabled={inputText.trim().length < 10}
                className="w-full rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-30"
              >
                Read them
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}

function OtherPersonResult({ result, onReset, onShare }: { result: any; onReset: () => void; onShare?: () => void }) {
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

      {result.are_they_being_honest && (
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">Honesty read</p>
            <p className={`mt-0.5 font-display text-[28px] leading-none ${HONESTY_COLOR[result.are_they_being_honest] ?? "text-white"}`}>
              {result.are_they_being_honest}
            </p>
          </div>
          {result.honesty_reason && (
            <p className="text-[12px] text-white/50 leading-snug max-w-[220px]">{result.honesty_reason}</p>
          )}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">The read</p>
      <h1 className="font-display text-[26px] leading-tight text-gradient">{result.read}</h1>

      <div className="space-y-2.5">
        <Insight label="What they actually feel" body={result.what_they_actually_feel} />
        <Insight label="Their dominant pattern" body={result.their_dominant_pattern} />
        <Insight label="What they want" body={result.what_they_want} />
        <Insight label="Their blind spot" body={result.their_blind_spot} />
        <Insight label="How they see you" body={result.how_they_see_the_user} />
        <Insight label="Your move" body={result.the_move} accent="ok" />
      </div>

      {result.risk_flag && (
        <GlassPanel className="p-4 border border-red-900/40">
          <p className="text-[10px] uppercase tracking-[0.28em] text-red-400/80 mb-1.5">Risk flag</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{result.risk_flag}</p>
        </GlassPanel>
      )}

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground/50 pt-2">
        Mirror reads signals, not people
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
      <GlassPanel glow className="p-8 text-center mt-10 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Coming · {type.replace(/_/g, " ")}</p>
        <h1 className="font-display text-2xl text-gradient">Mirror is calibrating this read.</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">This scan type is being built now. You'll be the first to know when it's live.</p>
      </GlassPanel>
    </main>
  );
}
