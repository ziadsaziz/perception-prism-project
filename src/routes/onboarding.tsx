import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateBaselineRead } from "@/lib/ai.functions";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const GOALS = ["Dating", "Confidence", "Social presence", "Texting", "Attraction", "Career presence", "Content & social media", "Emotional clarity"];
const COMFORT = [
  { id: "manual", title: "Manual uploads only", desc: "You decide what Mirror sees. Nothing more." },
  { id: "optional", title: "Optional connected insights", desc: "Add signals when it's worth it." },
  { id: "full", title: "Full Mirror mode", desc: "Deepest reads. Maximum perception." },
];
const TONES = ["Gentle", "Direct", "Brutally honest", "Strategic"];

function Step({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="animate-fade-up">
      {eyebrow && <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>}
      {children}
    </div>
  );
}

function Onboarding() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const baselineFn = useServerFn(generateBaselineRead);

  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    main_goal: [] as string[], comfort_level: "", tone_preference: "Direct",
    name: "", age_range: "", gender: "",
    biggest_insecurity: "", social_challenge: "", dating_challenge: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [baseline, setBaseline] = useState<{ headline: string; truth: string; blind_spot: string; first_move: string } | null>(null);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await supabase.from("profiles").update({
        ...data,
        main_goal: data.main_goal.join(", "),
        onboarding_complete: true,
      }).eq("user_id", user.id);
      const read = await baselineFn({ data: {
        name: data.name, main_goal: data.main_goal.join(", "),
        insecurity: data.biggest_insecurity, social: data.social_challenge, dating: data.dating_challenge,
        tone: data.tone_preference,
      }});
      await supabase.from("profiles").update({ baseline_read: read.truth }).eq("user_id", user.id);
      setBaseline(read);
      setStep(6);
    } catch (e: any) {
      toast.error(e.message ?? "Mirror could not build your baseline.");
    } finally { setSubmitting(false); }
  };

  return (
    <main className="relative min-h-screen px-6 pt-12 pb-10 flex flex-col">
      <div className="flex items-center justify-between">
        <button onClick={back} disabled={step === 0 || step === 6} className="text-muted-foreground disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= step ? "bg-foreground" : "bg-muted"}`} />
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{Math.min(step + 1, 6)} / 6</span>
      </div>

      <div className="flex-1 flex flex-col justify-center my-10">
        {step === 0 && (
          <Step eyebrow="Mirror · 01">
            <h1 className="mt-4 font-display text-[36px] leading-[1.05] tracking-tight text-gradient">
              Most people never know how they actually come across.
            </h1>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">Mirror studies the signals people feel — but rarely say out loud.</p>
          </Step>
        )}

        {step === 1 && (
          <Step eyebrow="Mirror · 02">
            <h1 className="mt-4 font-display text-3xl text-gradient leading-tight">What do you want Mirror to sharpen?</h1>
            <p className="mt-2 text-xs text-muted-foreground">Select all that apply.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {GOALS.map(g => {
                const selected = data.main_goal.includes(g);
                return (
                  <button key={g} onClick={() => setData({...data, main_goal: selected ? data.main_goal.filter(x => x !== g) : [...data.main_goal, g]})}
                    className={`rounded-full px-4 py-2.5 text-xs tracking-wide ring-hairline transition-colors ${selected ? "bg-foreground text-background" : "bg-glass text-foreground/80"}`}>
                    {g}
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step eyebrow="Mirror · 03">
            <h1 className="mt-4 font-display text-3xl text-gradient leading-tight">How much do you want Mirror to see?</h1>
            <div className="mt-6 space-y-3">
              {COMFORT.map(c => (
                <button key={c.id} onClick={() => setData({...data, comfort_level: c.id})}
                  className={`w-full text-left rounded-2xl p-4 ring-hairline transition-colors ${data.comfort_level === c.id ? "bg-foreground text-background" : "bg-glass"}`}>
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className={`mt-1 text-xs ${data.comfort_level === c.id ? "text-background/70" : "text-muted-foreground"}`}>{c.desc}</div>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step eyebrow="Mirror · 04">
            <h1 className="mt-4 font-display text-3xl text-gradient leading-tight">Calibrate Mirror's voice.</h1>
            <p className="mt-2 text-xs text-muted-foreground">You can change this anytime.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setData({...data, tone_preference: t})}
                  className={`rounded-2xl py-4 px-3 text-sm ring-hairline transition-colors ${data.tone_preference === t ? "bg-foreground text-background" : "bg-glass"}`}>
                  {t}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step eyebrow="Mirror · 05">
            <h1 className="mt-4 font-display text-3xl text-gradient leading-tight">Build the baseline.</h1>
            <div className="mt-5 space-y-3">
              <Field label="Name" value={data.name} onChange={v => setData({...data, name: v})} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age range" placeholder="25-32" value={data.age_range} onChange={v => setData({...data, age_range: v})} />
                <Field label="Gender (optional)" value={data.gender} onChange={v => setData({...data, gender: v})} />
              </div>
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step eyebrow="Mirror · 06">
            <h1 className="mt-4 font-display text-3xl text-gradient leading-tight">Tell Mirror the truth.</h1>
            <p className="mt-2 text-xs text-muted-foreground">The sharper the input, the sharper the read.</p>
            <div className="mt-5 space-y-3">
              <Field label="Your biggest insecurity right now" textarea value={data.biggest_insecurity} onChange={v => setData({...data, biggest_insecurity: v})} />
              <Field label="Current social challenge" textarea value={data.social_challenge} onChange={v => setData({...data, social_challenge: v})} />
              <Field label="Current dating or communication challenge" textarea value={data.dating_challenge} onChange={v => setData({...data, dating_challenge: v})} />
            </div>
          </Step>
        )}

        {step === 6 && baseline && (
          <Step eyebrow="Your first read">
            <h1 className="mt-4 font-display text-[32px] leading-tight text-gradient">{baseline.headline}</h1>
            <div className="mt-6 bg-glass ring-hairline rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">The truth</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{baseline.truth}</p>
            </div>
            {baseline.blind_spot && (
              <div className="mt-3 bg-glass ring-hairline rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-crimson/80">Blind spot</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{baseline.blind_spot}</p>
              </div>
            )}
            {baseline.first_move && (
              <div className="mt-3 bg-glass ring-hairline rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-accent">First move</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{baseline.first_move}</p>
              </div>
            )}
          </Step>
        )}
      </div>

      {step < 5 && (
        <button onClick={next}
          disabled={(step === 1 && !data.main_goal) || (step === 2 && !data.comfort_level)}
          className="rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] flex items-center justify-center gap-2 disabled:opacity-40 glow-gold">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      )}
      {step === 5 && (
        <button onClick={finish} disabled={submitting}
          className="rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] flex items-center justify-center gap-2 disabled:opacity-40 glow-gold">
          {submitting ? "Reading you…" : <>Build my Mirror <ArrowRight className="h-4 w-4" /></>}
        </button>
      )}
      {step === 6 && (
        <button onClick={() => nav({ to: "/home" })}
          className="rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] flex items-center justify-center gap-2 glow-gold">
          Enter Mirror <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </main>
  );
}

function Field({ label, value, onChange, textarea, placeholder }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} placeholder={placeholder}
          className="mt-2 w-full bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground/30" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="mt-2 w-full bg-glass ring-hairline rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30" />
      )}
    </div>
  );
}
