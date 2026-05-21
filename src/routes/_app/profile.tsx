import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  validateSearch: z.object({ upgrade: z.string().optional() }),
  component: Profile,
});

const TONES = ["Gentle", "Direct", "Brutally honest", "Strategic"];

function Profile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const { plan, scansRemaining } = useSubscription();
  const { upgrade } = Route.useSearch();
  const [profile, setProfile] = useState<any>(null);
  const [, setSub] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([p, s]) => { setProfile(p.data); setSub(s.data); });
  }, [user]);

  useEffect(() => {
    if (upgrade) {
      const el = document.getElementById("pricing");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [upgrade]);

  const updateTone = async (tone: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ tone_preference: tone }).eq("user_id", user.id);
    setProfile({ ...profile, tone_preference: tone });
    toast.success("Mirror's voice recalibrated.");
  };

  const deleteAllScans = async () => {
    if (!user) return;
    if (!confirm("Delete all scans, patterns, and memory? This is irreversible.")) return;
    await Promise.all([
      supabase.from("scans").delete().eq("user_id", user.id),
      supabase.from("patterns").delete().eq("user_id", user.id),
      supabase.from("mirror_memory").delete().eq("user_id", user.id),
      supabase.from("perception_scores").delete().eq("user_id", user.id),
      supabase.from("advisor_messages").delete().eq("user_id", user.id),
    ]);
    toast.success("Mirror's memory wiped.");
  };

  return (
    <main className="px-5 pt-12 pb-6 space-y-5">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Your Mirror</p>
        <h1 className="font-display text-3xl text-gradient mt-1 inline-flex items-center gap-3">
          {profile?.name ?? "—"}
          <button
            onClick={() => {
              const n = prompt("Update your name:", profile?.name ?? "");
              if (n?.trim()) {
                supabase.from("profiles").update({ name: n.trim() }).eq("user_id", user?.id ?? "").then(() => {
                  setProfile((p: any) => ({ ...p, name: n.trim() }));
                  toast.success("Name updated.");
                });
              }
            }}
            className="text-[10px] uppercase tracking-[0.24em] text-white/30 hover:text-white/60"
          >
            Edit
          </button>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
      </header>

      {/* Subscription status */}
      <section id="pricing">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Your plan</p>
        <GlassPanel glow className="mt-2 p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-gradient">
                Mirror {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {plan === "free"
                  ? `${scansRemaining === Infinity ? 3 : scansRemaining} scans remaining this month`
                  : "Unlimited scans"}
              </p>
            </div>
            {plan === "free" && (
              <span className="text-[10px] uppercase tracking-[0.24em] px-2 py-1 rounded-full bg-muted/40 text-muted-foreground">Free</span>
            )}
            {plan === "plus" && (
              <span className="text-[10px] uppercase tracking-[0.24em] px-2 py-1 rounded-full bg-accent/20 text-accent">Plus</span>
            )}
            {plan === "elite" && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] px-2 py-1 rounded-full bg-[#C9A84C]/20 text-[#C9A84C]">
                <Sparkles className="h-3 w-3" /> Elite
              </span>
            )}
          </div>

          {plan === "free" && (
            <div className="space-y-3 pt-2">
              <PricingCard
                name="Plus"
                price="$9.99"
                features={[
                  "Unlimited text scans",
                  "Daily reads & missions",
                  "Pattern tracking",
                  "Weekly blind spot report",
                ]}
                highlight
                onSelect={() => toast("Stripe integration coming soon.")}
              />
              <PricingCard
                name="Elite"
                price="$29"
                features={[
                  "Everything in Plus",
                  "Voice, selfie, social, dating scans",
                  "Deeper memory & brutally honest mode",
                  "Monthly identity report",
                ]}
                elite
                onSelect={() => toast("Stripe integration coming soon.")}
              />
              <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                Stripe payments coming soon. Join the waitlist below.
              </p>
            </div>
          )}

          {plan !== "free" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {plan === "elite"
                ? "You have full access to every Mirror feature."
                : "Upgrade to Elite to unlock voice, selfie, and social scans."}
            </p>
          )}
        </GlassPanel>
      </section>


      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Mirror's tone</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TONES.map(t => (
            <button key={t} onClick={() => updateTone(t)}
              className={`rounded-2xl py-3 text-sm ring-hairline ${profile?.tone_preference === t ? "bg-foreground text-background" : "bg-glass"}`}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">Privacy & data</p>
        <GlassPanel className="mt-2 divide-y divide-border/40">
          <Row label="Manual mode" sub="Mirror only sees what you upload" value={profile?.comfort_level === "manual" ? "On" : "Off"} />
          <Row label="Connected insights" sub="Future: photos, calendar, social" value="Coming soon" muted />
          <Row label="Export data" sub="Download everything Mirror has on you" action="Export" onClick={() => toast("Export ready in v2.")} />
          <Row label="Delete all scans" sub="Wipe Mirror's memory of you" action="Delete" danger onClick={deleteAllScans} />
        </GlassPanel>
      </section>

      {/* Daily read history */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1">
          This week's reads
        </p>
        <DailyHistory />
      </section>

      <button onClick={async () => { await signOut(); nav({ to: "/" }); }}
        className="w-full rounded-full bg-glass ring-hairline py-3.5 text-xs uppercase tracking-[0.24em] text-muted-foreground">
        Sign out
      </button>

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground pt-2">
        Mirror v1.0 · Private by design
      </p>
    </main>
  );
}

function Row({ label, sub, value, action, onClick, danger, muted }: any) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{label}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {action ? (
        <button onClick={onClick} className={`text-[10px] uppercase tracking-[0.24em] ${danger ? "text-crimson" : "text-accent"}`}>{action}</button>
      ) : (
        <span className={`text-[10px] uppercase tracking-[0.24em] ${muted ? "text-muted-foreground" : "text-foreground/80"}`}>{value}</span>
      )}
    </div>
  );
}

function DailyHistory() {
  const { user } = useAuth();
  const [reads, setReads] = useState<Array<{ read: string; mission: string; date: string }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_reads")
      .select("read, mission, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(7)
      .then(({ data }) => setReads(data ?? []));
  }, [user]);

  if (reads.length === 0) {
    return (
      <GlassPanel className="mt-2 p-5">
        <p className="text-sm text-muted-foreground">No reads yet. Open Mirror tomorrow morning.</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="mt-2 divide-y divide-border/40">
      {reads.map((r, i) => (
        <div key={r.date} className="px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-accent">
            {i === 0
              ? "Today"
              : new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <p className="mt-1.5 text-sm text-foreground/90 leading-snug">{r.read}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">↳ {r.mission}</p>
        </div>
      ))}
    </GlassPanel>
  );
}

function PricingCard({
  name, price, features, highlight, elite, onSelect,
}: {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  elite?: boolean;
  onSelect: () => void;
}) {
  const accentColor = elite ? "text-[#C9A84C]" : "text-accent";
  const ringClass = elite
    ? "ring-1 ring-[#C9A84C]/40"
    : highlight
      ? "ring-1 ring-accent/40"
      : "ring-hairline";

  return (
    <div className={`rounded-2xl bg-glass ${ringClass} p-5 space-y-4`}>
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <p className={`text-[10px] uppercase tracking-[0.28em] ${accentColor}`}>Mirror {name}</p>
          {elite && <Sparkles className="h-3 w-3 text-[#C9A84C]" />}
        </div>
        <p className="font-display text-xl text-foreground">
          {price}
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground ml-1">/mo</span>
        </p>
      </div>

      <ul className="space-y-2">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${accentColor}`} strokeWidth={2} />
            <span className="text-xs text-foreground/90 leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full rounded-full py-3 text-[10px] uppercase tracking-[0.28em] ${
          elite
            ? "bg-[#C9A84C] text-background"
            : "bg-foreground text-background"
        }`}
      >
        Get {name}
      </button>
    </div>
  );
}
