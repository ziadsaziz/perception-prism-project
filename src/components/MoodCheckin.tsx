import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const MOODS = [
  { key: "sharp", label: "Sharp", emoji: "⚡", desc: "On it. Clear headed." },
  { key: "steady", label: "Steady", emoji: "●", desc: "Balanced. Present." },
  { key: "drained", label: "Drained", emoji: "◌", desc: "Low energy. Going through motions." },
  { key: "anxious", label: "Anxious", emoji: "◎", desc: "Head spinning. Overthinking." },
  { key: "frustrated", label: "Frustrated", emoji: "▲", desc: "Something isn't working." },
  { key: "disconnected", label: "Disconnected", emoji: "○", desc: "Not here. Going through motions." },
];

const ENERGY_LEVELS = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Medium" },
  { value: 4, label: "High" },
  { value: 5, label: "Very high" },
];

interface MoodCheckinProps {
  onComplete: (mood: string, energy: number, context: string) => void;
  onSkip: () => void;
}

export function MoodCheckin({ onComplete, onSkip }: MoodCheckinProps) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState(3);
  const [happened, setHappened] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const save = async () => {
    if (!mood) return;
    setSaving(true);
    try {
      if (user) {
        await supabase.from("daily_checkins").upsert({
          user_id: user.id,
          date: new Date().toISOString().slice(0, 10),
          mood,
          energy_level: energy,
          what_happened: happened,
          checkin_completed: true,
        }, { onConflict: "user_id,date" });
      }
      onComplete(mood, energy, happened);
    } catch {
      onComplete(mood, energy, happened);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-glass ring-hairline rounded-3xl p-6 space-y-6 shadow-glass">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Daily calibration</p>
              <h2 className="text-2xl font-light tracking-tight">Where are you right now?</h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMood(m.key); setStep(1); }}
                  className={`text-left rounded-2xl px-4 py-3.5 border transition-all ${
                    mood === m.key
                      ? "border-[#C9A84C]/50 bg-[#C9A84C]/10"
                      : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-lg mb-1">{m.emoji}</p>
                  <p className="text-[13px] text-foreground/90">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground/70 leading-snug mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={onSkip}
              className="w-full text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60 py-2"
            >
              Skip for today
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">Energy level</p>
              <h2 className="text-2xl font-light tracking-tight">How charged are you?</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2 h-24">
                {ENERGY_LEVELS.map(e => (
                  <button
                    key={e.value}
                    onClick={() => setEnergy(e.value)}
                    className="flex flex-col items-center gap-2 flex-1"
                  >
                    <div
                      className={`w-full rounded-md transition-all ${
                        energy >= e.value ? "bg-[#C9A84C]/30" : "bg-white/[0.06]"
                      }`}
                      style={{ height: `${e.value * 14 + 20}px` }}
                    />
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${
                      energy === e.value ? "text-[#C9A84C]" : "text-muted-foreground/50"
                    }`}>
                      {e.value}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                {ENERGY_LEVELS.find(e => e.value === energy)?.label}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Anything Mirror should know? (optional)
              </p>
              <textarea
                value={happened}
                onChange={(e) => setHappened(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="Something happened, a conversation, a situation…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-full border border-white/10 text-white/40 py-3.5 text-[11px] uppercase tracking-[0.28em]"
              >
                Back
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-[2] rounded-full bg-[#C9A84C] text-black py-3.5 text-[11px] uppercase tracking-[0.28em] font-medium disabled:opacity-50"
              >
                {saving ? "Calibrating…" : "Enter Mirror"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function useTodayCheckin() {
  const { user } = useAuth();
  const [checkinDone, setCheckinDone] = useState<boolean | null>(null);
  const [checkinData, setCheckinData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("daily_checkins")
      .select("checkin_completed, mood, energy_level, what_happened")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        setCheckinDone(data?.checkin_completed ?? false);
        setCheckinData(data);
      });
  }, [user]);

  return { checkinDone, checkinData, setCheckinDone };
}
