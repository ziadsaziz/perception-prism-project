import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import {
  ScanLine, Image as ImageIcon, Mic, Heart,
  Users, TrendingUp, Sparkles, X
} from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    label: "Welcome to Mirror",
    headline: "Mirror reads you.\nNot at you.",
    body: "Everything Mirror builds — your scores, your patterns, your reads — gets sharper the more you use it. This is a 60-second tour of what Mirror can do.",
    cta: "Show me",
    icon: null,
    color: "#C9A84C",
  },
  {
    id: "text_scan",
    label: "Text Conversation",
    headline: "Paste any conversation.\nMirror reads what happened.",
    body: "Someone went cold. A conversation felt off. You don't know why. Paste it here. Mirror reads the tone, the pressure points, and what the other person actually felt.",
    cta: "Got it",
    icon: ScanLine,
    color: "#C9A84C",
    action: { label: "Try it now", to: "/scan", search: { type: "text" } },
  },
  {
    id: "other_person",
    label: "Read Someone Else",
    headline: "What are they\nactually feeling?",
    body: "Paste their messages. Mirror reads the other person — their dominant pattern, what they actually want, and whether they're being honest with you.",
    cta: "Got it",
    icon: Users,
    color: "#C9A84C",
    action: { label: "Try it now", to: "/scan", search: { type: "other" } },
  },
  {
    id: "selfie",
    label: "Selfie & Presence",
    headline: "Upload a photo.\nMirror reads your presence.",
    body: "First impressions happen in 3 seconds. Mirror reads the energy, confidence, and signals you project before you say a word. Elite feature.",
    cta: "Got it",
    icon: ImageIcon,
    color: "#C9A84C",
    action: { label: "Try it now", to: "/scan", search: { type: "selfie" } },
  },
  {
    id: "mirror_score",
    label: "Mirror Score",
    headline: "One number.\nYour social intelligence.",
    body: "Your Mirror Score tracks your overall perception across 8 dimensions — Confidence, Attraction, Authority, Mystery, and more. It updates after every scan. Watch it move.",
    cta: "Got it",
    icon: TrendingUp,
    color: "#C9A84C",
    action: { label: "See evolution", to: "/evolution", search: {} },
  },
  {
    id: "advisor",
    label: "Ask Mirror",
    headline: "Mirror knows your\npatterns. Ask it anything.",
    body: "The Mirror advisor has read your scans, detected your patterns, and built your memory. It answers questions about your behavior, your relationships, and your blind spots with full context.",
    cta: "Got it",
    icon: Sparkles,
    color: "#C9A84C",
    action: { label: "Ask Mirror", to: "/advisor", search: {} },
  },
  {
    id: "dossier",
    label: "Mirror Dossier",
    headline: "Your complete\nintelligence profile.",
    body: "After 3 scans Mirror compiles a full behavioral dossier — your Social Archetype, Core Signal, Dominant Pattern, Relationship Pattern, and a complete assessment. Updated weekly.",
    cta: "Got it",
    icon: null,
    color: "#C9A84C",
    action: { label: "Open dossier", to: "/dossier", search: {} },
  },
  {
    id: "daily",
    label: "Daily Read",
    headline: "Every morning.\nSomething new from Mirror.",
    body: "Mirror generates a fresh observation every day based on your patterns and mood check-in. Complete the daily move and Mirror tracks whether you followed through.",
    cta: "Start using Mirror",
    icon: null,
    color: "#C9A84C",
    final: true,
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const advance = async () => {
    if (isLast) {
      await complete();
    } else {
      setStep(s => s + 1);
    }
  };

  const complete = async () => {
    setExiting(true);
    if (user) {
      await supabase
        .from("profiles")
        .update({ tutorial_completed: true })
        .eq("user_id", user.id);
    }
    setTimeout(onComplete, 300);
  };

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col bg-[#0a0a12] transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}>
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-white/5">
        <div
          className="h-full bg-[#C9A84C] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip button */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {step + 1} / {STEPS.length}
        </p>
        <button
          onClick={complete}
          className="flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-white/60 transition-colors"
        >
          Skip <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Icon */}
          {current.icon && (
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                <current.icon className="h-6 w-6 text-[#C9A84C]" />
              </div>
            </div>
          )}

          {!current.icon && step === 0 && (
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] text-2xl font-light">
                ◆
              </div>
            </div>
          )}

          {/* Label */}
          <div className="text-center space-y-3">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">
              {current.label}
            </p>
            <h2 className="font-display text-2xl leading-snug text-gradient whitespace-pre-line">
              {current.headline}
            </h2>
            <p className="text-sm text-foreground/70 leading-relaxed max-w-[280px] mx-auto">
              {current.body}
            </p>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${
                  i === step
                    ? "w-5 h-1.5 bg-[#C9A84C]"
                    : i < step
                    ? "w-1.5 h-1.5 bg-[#C9A84C]/40"
                    : "w-1.5 h-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-8 pt-4 space-y-3">
        {current.action && !isLast && (
          <Link
            to={current.action.to}
            search={current.action.search}
            onClick={complete}
            className="block w-full text-center rounded-2xl border border-[#C9A84C]/30 text-[#C9A84C] py-3.5 text-[11px] uppercase tracking-[0.28em] hover:bg-[#C9A84C]/5 transition-colors"
          >
            {current.action.label}
          </Link>
        )}

        <button
          onClick={advance}
          className="w-full rounded-2xl bg-[#C9A84C] text-black py-3.5 text-[11px] uppercase tracking-[0.28em] font-medium hover:bg-[#C9A84C]/90 transition-colors"
        >
          {current.cta}
        </button>
      </div>
    </div>
  );
}
