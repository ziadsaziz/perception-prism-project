import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/GlassPanel";
import { Plan } from "@/hooks/use-subscription";

interface UpgradePromptProps {
  reason: "scan_limit" | "elite_feature" | "plus_feature";
  currentPlan: Plan;
}

const COPY = {
  scan_limit: {
    label: "Scan limit reached",
    heading: "You've used all 20 free scans this month.",
    body: "Mirror Plus gives you unlimited text scans, daily reads, pattern tracking, and your weekly blind spot report.",
    cta: "Unlock Mirror Plus",
    target: "plus",
  },
  elite_feature: {
    label: "Elite feature",
    heading: "This scan type requires Mirror Elite.",
    body: "Voice, selfie, social, and dating scans are part of Mirror Elite — along with deeper memory, brutally honest mode, and your monthly identity report.",
    cta: "Unlock Mirror Elite",
    target: "elite",
  },
  plus_feature: {
    label: "Plus feature",
    heading: "This requires Mirror Plus.",
    body: "Upgrade to Mirror Plus for unlimited scans, pattern tracking, and your weekly blind spot report.",
    cta: "Unlock Mirror Plus",
    target: "plus",
  },
} as const;

export function UpgradePrompt({ reason }: UpgradePromptProps) {
  const copy = COPY[reason];

  return (
    <GlassPanel glow className="p-6 text-center space-y-4">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary/60 flex items-center justify-center">
        {reason === "elite_feature" ? (
          <Sparkles className="h-5 w-5 text-[#C9A84C]" strokeWidth={1.5} />
        ) : (
          <Lock className="h-5 w-5 text-accent" strokeWidth={1.5} />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">{copy.label}</p>
        <h2 className="font-display text-xl text-gradient leading-tight">{copy.heading}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{copy.body}</p>
      </div>

      <Link
        to="/profile"
        search={{ upgrade: copy.target }}
        className="inline-block rounded-full bg-foreground text-background px-6 py-3 text-xs uppercase tracking-[0.24em] glow-gold"
      >
        {copy.cta}
      </Link>

      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
        Cancel anytime. No contracts.
      </p>
    </GlassPanel>
  );
}
