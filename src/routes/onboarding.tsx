import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateBaselineFromSignals } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

type Phase = "entry" | "q1" | "q2" | "q3" | "q4" | "tone" | "processing" | "flash" | "read";

const QUESTIONS = [
  {
    key: "q1" as const,
    label: "SIGNAL 01",
    question: "What do you most want people to feel when they're around you?",
    sub: null,
    placeholder: "Be honest. Mirror doesn't judge — it observes.",
    cta: "Continue",
  },
  {
    key: "q2" as const,
    label: "SIGNAL 02",
    question: "What reaction do you get from people that you don't fully understand?",
    sub: null,
    placeholder: "The thing that keeps happening, even when you don't mean it to.",
    cta: "Continue",
  },
  {
    key: "q3" as const,
    label: "SIGNAL 03",
    question: "Who do you tend to lose — and when?",
    sub: "Friends. Partners. Rooms. Moments. Any of it.",
    placeholder: "Don't overthink it.",
    cta: "Continue",
  },
  {
    key: "q4" as const,
    label: "SIGNAL 04",
    question: "What do you never say out loud but always wonder about yourself?",
    sub: "This one stays between you and Mirror.",
    placeholder: "The question you ask yourself at 2am.",
    cta: "Let Mirror read you",
  },
];

const PROCESSING_LINES = [
  "Reading your signals…",
  "Detecting pressure points…",
  "Finding the pattern beneath the pattern…",
  "Separating what you do from who you are…",
  "Building your baseline…",
];

function Wordmark() {
  return (
    <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
      <span className="text-[10px] tracking-[0.5em] text-white/40 uppercase">Mirror</span>
    </div>
  );
}

function Fade({ show, children, duration = 600 }: { show: boolean; children: React.ReactNode; duration?: number }) {
  return (
    <div
      className="transition-opacity ease-in-out"
      style={{ opacity: show ? 1 : 0, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

function Onboarding() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const baselineFn = useServerFn(generateBaselineFromSignals);

  const [phase, setPhase] = useState<Phase>("entry");
  const [visible, setVisible] = useState(true);
  const [answers, setAnswers] = useState({ signal_01: "", signal_02: "", signal_03: "", signal_04: "" });
  const [tone, setTone] = useState<string>("Direct");
  const [draft, setDraft] = useState("");
  const [processIdx, setProcessIdx] = useState(0);
  const [baseline, setBaseline] = useState<{ read: string; truth: string; blind_spot: string; first_move: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    // If onboarding already complete, skip to home
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_complete) nav({ to: "/home" });
      });
  }, [user, loading, nav]);

  // Entry auto-advance
  useEffect(() => {
    if (phase !== "entry") return;
    const t = setTimeout(() => transition("q1"), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  // Focus input when entering a question
  useEffect(() => {
    if (["q1", "q2", "q3", "q4"].includes(phase)) {
      setDraft("");
      const t = setTimeout(() => inputRef.current?.focus(), 650);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Processing line cycler
  useEffect(() => {
    if (phase !== "processing") return;
    setProcessIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= PROCESSING_LINES.length) {
        clearInterval(id);
        transition("flash");
      } else {
        setProcessIdx(i);
      }
    }, 1800);
    return () => clearInterval(id);
  }, [phase]);

  // Flash wordmark then show baseline (only after read is ready)
  useEffect(() => {
    if (phase !== "flash") return;
    const t = setTimeout(() => { if (baseline) transition("read"); }, 1000);
    return () => clearTimeout(t);
  }, [phase, baseline]);

  function transition(next: Phase) {
    setVisible(false);
    setTimeout(() => {
      setPhase(next);
      setVisible(true);
    }, 600);
  }

  async function submitAnswer(phaseKey: "q1" | "q2" | "q3" | "q4") {
    const value = draft.trim();
    if (!value) return;
    const key = `signal_0${phaseKey[1]}` as keyof typeof answers;
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (phaseKey === "q4") {
      transition("processing");
      try {
        const result = await baselineFn({ data: updated });
        setBaseline(result);
      } catch (e: any) {
        toast.error(e?.message ?? "Mirror could not build your baseline.");
        transition("q4");
      }
    } else {
      const nextKey = `q${Number(phaseKey[1]) + 1}` as Phase;
      transition(nextKey);
    }
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Wordmark />

      {/* ENTRY */}
      {phase === "entry" && (
        <Fade show={visible}>
          <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <h1 className="font-display text-[30px] leading-tight max-w-[420px] tracking-tight">
              Before Mirror reads you, it needs to calibrate.
            </h1>
            <p className="mt-5 text-[14px] text-[#888]">
              Four questions. No right answers. Mirror is already listening.
            </p>
          </div>
        </Fade>
      )}

      {/* QUESTIONS */}
      {(["q1", "q2", "q3", "q4"] as const).map((q) => {
        if (phase !== q) return null;
        const meta = QUESTIONS.find(x => x.key === q)!;
        const isFinal = q === "q4";
        return (
          <Fade key={q} show={visible}>
            <div className="min-h-screen flex flex-col items-center px-6 pt-28 pb-12">
              <div className="flex-1 flex flex-col items-center justify-center w-full text-center">
                <p className="text-[11px] tracking-[0.42em] text-white/50 uppercase">{meta.label}</p>
                <h2 className="mt-8 font-display text-[28px] sm:text-[32px] leading-[1.2] tracking-tight max-w-[480px]">
                  {meta.question}
                </h2>
                {meta.sub && <p className="mt-3 text-[14px] text-[#888] max-w-[420px]">{meta.sub}</p>}

                <div className="mt-10 w-full max-w-[460px]">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(q); }}
                    placeholder={meta.placeholder}
                    className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-5 py-4 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={() => submitAnswer(q)}
                disabled={!draft.trim()}
                className={`text-[13px] tracking-[0.32em] uppercase transition-opacity ${
                  isFinal ? "text-[#C9A84C] text-[15px]" : "text-[#C9A84C]"
                } disabled:opacity-25`}
              >
                {meta.cta}
              </button>
            </div>
          </Fade>
        );
      })}

      {/* PROCESSING */}
      {phase === "processing" && (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="relative h-12 w-full max-w-[420px] text-center">
            {PROCESSING_LINES.map((line, i) => (
              <p
                key={i}
                className="absolute inset-0 flex items-center justify-center text-[16px] text-white/80 tracking-wide transition-opacity duration-700"
                style={{ opacity: processIdx === i ? 1 : 0 }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* FLASH */}
      {phase === "flash" && (
        <Fade show={visible}>
          <div className="min-h-screen flex items-center justify-center">
            <span className="text-[24px] tracking-[0.6em] text-white uppercase">Mirror</span>
          </div>
        </Fade>
      )}

      {/* BASELINE READ */}
      {phase === "read" && baseline && (
        <Fade show={visible}>
          <div className="min-h-screen pt-20 pb-12 px-6">
            <div className="mx-auto max-w-[520px] rounded-2xl bg-[#0D0D0D] border-t-2 border-t-[#C9A84C] border-x border-b border-white/[0.04] px-6 py-8">
              <p className="text-[10px] tracking-[0.42em] uppercase text-white/40">Your baseline read</p>
              <p className="mt-2 text-[12px] text-[#666]">Based on your signals. Mirror gets sharper as it learns more.</p>

              <Section label="The read" tone="white">
                <p className="text-[18px] leading-[1.4] font-display tracking-tight text-white whitespace-pre-line">{baseline.read}</p>
              </Section>

              <Section label="The truth" tone="muted">
                <p className="text-[14px] leading-[1.7] text-white/85 whitespace-pre-line">{baseline.truth}</p>
              </Section>

              {baseline.blind_spot && (
                <Section label="The blind spot" tone="muted">
                  <p className="text-[14px] leading-[1.7] text-white/85 whitespace-pre-line">{baseline.blind_spot}</p>
                </Section>
              )}

              {baseline.first_move && (
                <Section label="The first move" tone="gold">
                  <p className="text-[14px] leading-[1.7] text-white/85 whitespace-pre-line">{baseline.first_move}</p>
                </Section>
              )}

              <div className="mt-10 space-y-3">
                <button
                  onClick={() => nav({ to: "/scan" })}
                  className="w-full rounded-full bg-black border border-[#C9A84C]/50 text-[#C9A84C] py-4 text-[12px] tracking-[0.32em] uppercase hover:bg-[#C9A84C]/5 transition-colors"
                >
                  Start your first scan
                </button>
                <button
                  onClick={() => nav({ to: "/home" })}
                  className="w-full py-3 text-[12px] tracking-[0.32em] uppercase text-white/60 hover:text-white/90 transition-colors"
                >
                  Save this read
                </button>
              </div>
            </div>
          </div>
        </Fade>
      )}
    </main>
  );
}

function Section({ label, tone, children }: { label: string; tone: "white" | "muted" | "gold"; children: React.ReactNode }) {
  const color = tone === "gold" ? "text-[#C9A84C]" : tone === "white" ? "text-white/70" : "text-white/40";
  return (
    <div className="mt-7">
      <p className={`text-[10px] tracking-[0.42em] uppercase ${color}`}>{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
