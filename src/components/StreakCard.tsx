import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";

const MILESTONE_MESSAGES: Record<number, string> = {
  3: "Three days in. Mirror is starting to see patterns.",
  7: "One week. Most people quit before this.",
  14: "Two weeks. Your profile is sharpening.",
  21: "21 days. This is a habit now.",
  30: "30 days. Mirror knows you better than most people do.",
  60: "60 days. You're in the top 1% of Mirror users.",
  100: "100 days. Mirror has a complete picture of who you are.",
};

const STREAK_LABELS = [
  { days: 1, label: "Day one" },
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 21, label: "21 days" },
  { days: 30, label: "1 month" },
  { days: 60, label: "2 months" },
  { days: 100, label: "100 days" },
];

function FlameBar({ streak }: { streak: number }) {
  const maxVisible = 7;
  const days = Array.from({ length: maxVisible }, (_, i) => i + 1);

  return (
    <div className="flex items-end gap-1.5">
      {days.map(d => {
        const active = d <= streak;
        const isToday = d === Math.min(streak, maxVisible);
        return (
          <div key={d} className="flex flex-col items-center gap-1">
            <div
              className={`w-4 rounded-sm transition-all ${
                active
                  ? isToday
                    ? "h-5 bg-[#C9A84C]"
                    : "h-4 bg-[#C9A84C]/60"
                  : "h-3 bg-white/[0.06]"
              }`}
            />
            <span className={`text-[9px] ${active ? "text-white/50" : "text-white/20"}`}>{d}</span>
          </div>
        );
      })}
      {streak > maxVisible && (
        <div className="ml-2 flex flex-col items-start">
          <span className="text-[11px] text-[#C9A84C] font-medium">+{streak - maxVisible}</span>
          <span className="text-[9px] text-white/30">more</span>
        </div>
      )}
    </div>
  );
}

export function StreakCard() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("current_streak, longest_streak, last_active_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setStreak((data as any)?.current_streak ?? 0);
        setLongest((data as any)?.longest_streak ?? 0);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />;
  if (streak === 0) return null;

  const milestoneMsg = MILESTONE_MESSAGES[streak];
  const nextMilestone = STREAK_LABELS.find(m => m.days > streak);

  return (
    <div
      className={`rounded-2xl p-4 border ${
        streak >= 7
          ? "bg-[#C9A84C]/[0.08] border-[#C9A84C]/25"
          : "bg-glass ring-hairline"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame
            className={`h-4 w-4 ${streak >= 7 ? "text-[#C9A84C]" : "text-white/40"}`}
            strokeWidth={1.5}
          />
          <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            Streak
          </span>
        </div>
        <div className="flex items-center gap-3">
          {longest > streak && (
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Best: {longest}
            </span>
          )}
          <span
            className={`font-display text-[28px] leading-none ${
              streak >= 30 ? "text-[#C9A84C]" :
              streak >= 7 ? "text-white" :
              "text-white/70"
            }`}
          >
            {streak}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <FlameBar streak={streak} />
      </div>

      {milestoneMsg && (
        <p className="mt-3 text-[12px] text-white/70 leading-relaxed">{milestoneMsg}</p>
      )}

      {!milestoneMsg && nextMilestone && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {nextMilestone.days - streak} {nextMilestone.days - streak === 1 ? "day" : "days"} to {nextMilestone.label}
        </p>
      )}
    </div>
  );
}
