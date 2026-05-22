import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { exportMirrorData } from "@/lib/export";
import { GlassPanel } from "@/components/GlassPanel";
import { WeeklyReport } from "@/components/WeeklyReport";
import { ReferralCard } from "@/components/ReferralCard";
import { toast } from "sonner";
import { ChevronRight, LogOut, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  validateSearch: z.object({ upgrade: z.string().optional() }),
  component: Profile,
});

const TONE_OPTIONS = [
  { key: "Gentle", label: "Gentle", desc: "Warm and honest. Truth with care." },
  { key: "Direct", label: "Direct", desc: "Clear and balanced. No fluff." },
  { key: "Brutally honest", label: "Brutally honest", desc: "Sharp. Uncomfortable because it's true." },
  { key: "Strategic", label: "Strategic", desc: "Leverage and outcome focused." },
];

function Profile() {
  const { user, signOut } = useAuth();
  const { plan, scanCount, scansRemaining } = useSubscription();
  const { upgrade } = Route.useSearch();

  const [profile, setProfile] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingTone, setEditingTone] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([p, s]) => {
      setProfile(p.data);
      setSub(s.data);
      setNewName(p.data?.name ?? "");
    });
  }, [user]);

  useEffect(() => {
    if (upgrade) {
      const el = document.getElementById("plan");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [upgrade]);

  const saveName = async () => {
    if (!user || !newName.trim()) return;
    await supabase.from("profiles").update({ name: newName.trim() }).eq("user_id", user.id);
    setProfile((p: any) => ({ ...p, name: newName.trim() }));
    setEditingName(false);
    toast.success("Name updated.");
  };

  const saveTone = async (tone: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ tone_preference: tone }).eq("user_id", user.id);
    setProfile((p: any) => ({ ...p, tone_preference: tone }));
    setEditingTone(false);
    toast.success("Tone updated. Mirror adjusts from your next scan.");
  };

  const handleExport = async () => {
    if (!user || exporting) return;
    setExporting(true);
    try {
      await exportMirrorData(user.id, profile?.name ?? "mirror-user");
      toast.success("Your data has been downloaded.");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const ok = window.confirm(
      "Delete your account and everything Mirror has on you? This is permanent and cannot be undone."
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await Promise.all([
        supabase.from("scans").delete().eq("user_id", user.id),
        supabase.from("patterns").delete().eq("user_id", user.id),
        supabase.from("mirror_memory").delete().eq("user_id", user.id),
        supabase.from("perception_scores").delete().eq("user_id", user.id),
        supabase.from("daily_reads").delete().eq("user_id", user.id),
        supabase.from("advisor_messages").delete().eq("user_id", user.id),
        supabase.from("weekly_reports").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);
      await signOut();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed.");
      setDeleting(false);
    }
  };

  const currentTone = profile?.tone_preference ?? "Direct";

  return (
    <main className="px-5 pt-12 pb-10 space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</p>
        <h1 className="font-display text-4xl text-gradient mt-1">Profile.</h1>
      </header>

      {/* Identity */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Identity</p>
        <GlassPanel className="divide-y divide-border/40">
          <div className="px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">Name</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-transparent ring-hairline rounded-xl px-3 py-2 text-sm"
                  autoFocus
                />
                <button onClick={saveName} className="text-[10px] uppercase tracking-[0.24em] text-accent px-2">Save</button>
                <button
                  onClick={() => { setEditingName(false); setNewName(profile?.name ?? ""); }}
                  className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground px-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm text-foreground">{profile?.name ?? "—"}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          </div>

          <div className="px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">Main goal</p>
            <p className="text-sm text-muted-foreground">{profile?.main_goal ?? "—"}</p>
          </div>

          <Link to="/dossier" className="block px-4 py-3.5 active:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#C9A84C] mb-1.5">Mirror Dossier</p>
                <p className="text-sm text-foreground/80">Your full behavioral intelligence profile</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </GlassPanel>
      </section>

      {/* Mirror tone */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Mirror tone</p>
        <GlassPanel className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{currentTone}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {TONE_OPTIONS.find(t => t.key === currentTone)?.desc}
              </p>
            </div>
            <button
              onClick={() => setEditingTone(v => !v)}
              className="text-[10px] uppercase tracking-[0.24em] text-accent"
            >
              {editingTone ? "Cancel" : "Change"}
            </button>
          </div>

          {editingTone && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              {TONE_OPTIONS.map(t => {
                const active = currentTone === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => saveTone(t.key)}
                    className={`w-full text-left rounded-2xl p-3 ring-1 transition ${
                      active
                        ? "ring-[#C9A84C]/50 bg-[#C9A84C]/10"
                        : "ring-hairline bg-glass hover:bg-white/[0.03]"
                    }`}
                  >
                    <p className={`text-sm ${active ? "text-[#C9A84C]" : "text-foreground"}`}>{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          )}
        </GlassPanel>
      </section>

      {/* Plan */}
      <section id="plan">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Your plan</p>
        <GlassPanel glow className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-[#C9A84C] capitalize">Mirror {plan}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {plan === "free"
                  ? `${scanCount}/3 scans this month · ${scansRemaining} remaining`
                  : "Unlimited scans"}
              </p>
            </div>
            {plan !== "free" && (
              <span className="relative flex h-2.5 w-2.5 mt-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C9A84C] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#C9A84C]" />
              </span>
            )}
          </div>

          {plan === "free" && (
            <div className="space-y-3 pt-1">
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
                onSelect={() => toast("Stripe payments coming soon.")}
              />
              <PricingCard
                name="Elite"
                price="$24.99"
                features={[
                  "Everything in Plus",
                  "Voice, selfie, social, dating scans",
                  "Deeper memory & brutally honest mode",
                  "Monthly identity report",
                ]}
                elite
                onSelect={() => toast("Stripe payments coming soon.")}
              />
              <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
                Payments launching soon.
              </p>
            </div>
          )}

          {plan === "plus" && (
            <div className="pt-1">
              <PricingCard
                name="Elite"
                price="$24.99"
                features={[
                  "Voice, selfie, social, dating scans",
                  "Deeper memory & brutally honest mode",
                  "Monthly identity report",
                ]}
                elite
                onSelect={() => toast("Stripe payments coming soon.")}
              />
            </div>
          )}

          {plan === "elite" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have full access to every Mirror feature.
            </p>
          )}
        </GlassPanel>
      </section>

      <section>
        <WeeklyReport />
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">This week's reads</p>
        {user?.id && <DailyHistory userId={user.id} />}
      </section>

      {/* Privacy */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Privacy & data</p>
        <GlassPanel className="divide-y divide-border/40">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-sm text-foreground">Export your data</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                Download everything Mirror has on you
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
              {exporting ? "Exporting…" : "Export"}
            </span>
          </button>
          <Link
            to="/"
            className="w-full px-4 py-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-foreground">Privacy policy</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                How Mirror handles your data
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </GlassPanel>
      </section>

      {/* Account */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground px-1 mb-2">Account</p>
        <GlassPanel className="divide-y divide-border/40">
          <button
            onClick={async () => { await signOut(); }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-foreground">Sign out</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-sm text-red-400">Delete account</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                  Permanent. Wipes everything.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-red-400">
              {deleting ? "Deleting…" : "Delete"}
            </span>
          </button>
        </GlassPanel>
      </section>

      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground pt-2">
        Mirror · Private by design
      </p>
    </main>
  );
}

function DailyHistory({ userId }: { userId: string }) {
  const [reads, setReads] = useState<Array<{ read: string; mission: string; date: string }>>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("daily_reads")
      .select("read, mission, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7)
      .then(({ data }) => setReads(data ?? []));
  }, [userId]);

  if (reads.length === 0) {
    return (
      <GlassPanel className="p-5">
        <p className="text-sm text-muted-foreground">No reads yet. Come back tomorrow morning.</p>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-2">
      {reads.map((r, i) => (
        <GlassPanel key={r.date} className="px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">
            {i === 0
              ? "Today"
              : new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <p className="mt-1.5 text-sm text-foreground/90 leading-snug">{r.read}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">↳ {r.mission}</p>
        </GlassPanel>
      ))}
    </div>
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
  const accent = elite ? "text-[#C9A84C]" : "text-accent";
  const ring = elite
    ? "ring-1 ring-[#C9A84C]/40"
    : highlight
      ? "ring-1 ring-accent/40"
      : "ring-hairline";

  return (
    <div className={`rounded-2xl bg-glass ${ring} p-5 space-y-4`}>
      <div className="flex items-baseline justify-between">
        <p className={`text-[10px] uppercase tracking-[0.28em] ${elite ? "text-[#C9A84C]" : "text-muted-foreground"}`}>
          Mirror {name}
        </p>
        <p className="font-display text-2xl text-foreground">
          {price}
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground ml-1">/mo</span>
        </p>
      </div>

      <ul className="space-y-2">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C9A84C] shrink-0" />
            <span className="text-xs text-foreground/90 leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full rounded-full py-3 text-[10px] uppercase tracking-[0.28em] transition ${
          elite
            ? "bg-[#C9A84C] text-background"
            : `border border-[#C9A84C]/60 ${accent} hover:bg-[#C9A84C]/10`
        }`}
      >
        Get {name}
      </button>
    </div>
  );
}
