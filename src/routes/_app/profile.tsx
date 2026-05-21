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
        <h1 className="font-display text-3xl text-gradient mt-1">{profile?.name ?? "—"}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
      </header>

      <GlassPanel glow className="p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-accent">Current plan</p>
        <p className="mt-2 font-display text-2xl text-gradient capitalize">{sub?.plan ?? "Free"}</p>
        <p className="mt-2 text-xs text-muted-foreground">Mirror gets sharper the more it studies your patterns.</p>
        <button className="mt-4 rounded-full px-5 py-3 text-xs uppercase tracking-[0.24em] bg-foreground text-background"
          onClick={() => toast("Upgrades launching soon. Mirror Plus & Elite tiers coming.")}>
          Upgrade Mirror
        </button>
      </GlassPanel>

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
