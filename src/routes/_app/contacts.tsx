import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";
import { Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/contacts")({ component: Contacts });

const RELATIONSHIP_TYPES = [
  "Partner", "Ex", "Situationship", "Date", "Friend",
  "Best friend", "Family", "Boss", "Colleague", "Rival", "Other",
];

const AVATAR_COLORS = [
  "#C9A84C", "#8B0000", "#1a3a5c", "#2d4a2d", "#4a2d4a", "#3a3a1a",
];

const TRAJECTORY_COLOR: Record<string, string> = {
  "Growing closer": "text-green-400/70",
  "Drifting apart": "text-red-400/70",
  "Stable": "text-white/40",
  "Cyclical": "text-orange-400/70",
  "Unclear": "text-white/20",
};

function ContactAvatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-10 w-10 text-[14px]", md: "h-14 w-14 text-[18px]", lg: "h-20 w-20 text-[28px]" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-display text-white shrink-0`}
      style={{ background: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function AddContactSheet({ onAdd, onClose }: { onAdd: (contact: any) => void; onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Friend");
  const [knownSince, setKnownSince] = useState("");
  const [keyFacts, setKeyFacts] = useState("");
  const [whatYouWant, setWhatYouWant] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const save = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      const { data } = await supabase.from("contacts").insert({
        user_id: user.id,
        name: name.trim(),
        relationship_type: relationship,
        known_since: knownSince || null,
        key_facts: keyFacts || null,
        what_you_want: whatYouWant || null,
        avatar_color: color,
      }).select().single();
      if (data) onAdd(data);
      toast.success(`${name} added to Mirror.`);
    } catch {
      toast.error("Could not add contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-background border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Close</button>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">New contact</p>
              <h2 className="font-display text-2xl text-gradient mt-1">Who is this?</h2>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Avatar color</p>
              <div className="flex gap-2">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: color === c ? "white" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Their name"
              autoFocus
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-[16px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />

            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Relationship</p>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_TYPES.map(r => (
                  <button
                    key={r}
                    onClick={() => setRelationship(r)}
                    className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                      relationship === r
                        ? "bg-[#C9A84C] text-black"
                        : "bg-white/[0.05] border border-white/[0.08] text-muted-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full rounded-full bg-[#C9A84C] text-black py-4 text-[11px] uppercase tracking-[0.28em] font-medium disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Tell Mirror about {name}</p>
              <h2 className="font-display text-2xl text-gradient mt-1">What does Mirror need to know?</h2>
              <p className="text-[12px] text-muted-foreground mt-1">The more Mirror knows, the sharper every read.</p>
            </div>

            <input
              value={knownSince}
              onChange={e => setKnownSince(e.target.value)}
              placeholder="How long have you known them? (e.g. 2 years, since college)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />

            <textarea
              value={keyFacts}
              onChange={e => setKeyFacts(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={`Key things Mirror should know about ${name}.\n\nExamples: Goes cold when overwhelmed. Doesn't like being pressured. Very direct. Has trust issues. Avoids conflict. Loves being chased.`}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />

            <textarea
              value={whatYouWant}
              onChange={e => setWhatYouWant(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={`What do you want from this relationship with ${name}?`}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-full border border-white/10 text-white/40 py-3.5 text-[11px] uppercase tracking-[0.28em]"
              >
                Back
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-full bg-[#C9A84C] text-black py-3.5 text-[11px] uppercase tracking-[0.28em] font-medium disabled:opacity-40"
              >
                {saving ? "Adding…" : `Add ${name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("contacts")
      .select("*, contact_dossier(relationship_trajectory, scan_count, attachment_style)")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setContacts(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</p>
          <h1 className="font-display text-3xl text-gradient mt-1">Contacts.</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="h-10 w-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center"
        >
          <Plus className="h-4 w-4 text-[#C9A84C]" strokeWidth={1.5} />
        </button>
      </header>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-shimmer rounded-2xl" />)}
        </div>
      ) : contacts.length === 0 ? (
        <GlassPanel glow className="p-8 text-center space-y-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A84C]">No contacts yet</p>
          <p className="font-display text-xl text-gradient">Add someone Mirror should learn.</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
            Mirror builds a behavioral intelligence profile on every person you add. The more you interact, the sharper it gets.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-[#C9A84C] text-black px-6 py-3 text-[11px] uppercase tracking-[0.28em] font-medium"
          >
            Add first contact
          </button>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => {
            const dossier = contact.contact_dossier?.[0];
            const scanCount = dossier?.scan_count ?? 0;
            const trajectory = dossier?.relationship_trajectory;

            return (
              <Link
                key={contact.id}
                to="/contacts/$contactId"
                params={{ contactId: contact.id }}
                className="block bg-glass ring-hairline rounded-2xl p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <ContactAvatar name={contact.name} color={contact.avatar_color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-medium text-white">{contact.name}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                      {contact.relationship_type}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {scanCount > 0 && (
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
                          {scanCount} {scanCount === 1 ? "interaction" : "interactions"}
                        </p>
                      )}
                      {trajectory && trajectory !== "Unclear" && (
                        <p className={`text-[10px] uppercase tracking-[0.18em] ${TRAJECTORY_COLOR[trajectory] ?? "text-white/30"}`}>
                          {trajectory}
                        </p>
                      )}
                      {scanCount === 0 && (
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/30">
                          No interactions yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddContactSheet
          onAdd={contact => {
            setContacts(prev => [contact, ...prev]);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </main>
  );
}
