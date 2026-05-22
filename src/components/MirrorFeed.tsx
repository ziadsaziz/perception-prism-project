import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateFeedItems } from "@/lib/ai.functions";
import { Link } from "@tanstack/react-router";

type FeedItem = {
  id: string;
  type: string;
  headline: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  observation: { label: "Observation", color: "text-white/50" },
  pattern_update: { label: "Pattern", color: "text-blue-400/70" },
  score_signal: { label: "Score signal", color: "text-[#C9A84C]" },
  blind_spot_flash: { label: "Blind spot", color: "text-red-400/70" },
  strength_signal: { label: "Strength", color: "text-green-400/70" },
};

function formatAge(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function MirrorFeed() {
  const { user } = useAuth();
  const generateFn = useServerFn(generateFeedItems);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const initialized = useRef(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mirror_feed")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as FeedItem[]);
    setLoading(false);
  };

  const generate = async () => {
    if (!user || generating) return;
    setGenerating(true);
    try {
      const result = await generateFn({} as any);
      if ((result as any)?.generated) await load();
    } catch {}
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;
    load().then(() => generate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markRead = async (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
    await supabase.from("mirror_feed").update({ read: true }).eq("id", id);
  };

  const dismiss = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("mirror_feed").delete().eq("id", id);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror feed</p>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror feed</p>
        <button
          onClick={generate}
          disabled={generating}
          className="text-[10px] uppercase tracking-[0.24em] text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating…" : "Refresh"}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
          <p className="text-sm text-white/70">Feed empty</p>
          <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
            Run your first scan. Mirror starts feeding observations as it learns your patterns.
          </p>
          <Link
            to="/scan"
            className="mt-4 inline-block text-[11px] uppercase tracking-[0.24em] text-[#C9A84C]"
          >
            Run a scan
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const cfg = TYPE_CONFIG[item.type] ?? { label: item.type, color: "text-white/50" };
            return (
              <div
                key={item.id}
                onClick={() => markRead(item.id)}
                className={`relative rounded-2xl px-4 py-3.5 border transition-all cursor-default ${
                  item.read
                    ? "bg-white/[0.02] border-white/[0.05]"
                    : "bg-white/[0.05] border-white/[0.10]"
                }`}
              >
                {!item.read && (
                  <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                )}

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase tracking-[0.28em] ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-white/30">·</span>
                  <span className="text-[10px] text-white/30">{formatAge(item.created_at)}</span>
                </div>

                <p className="mt-2 text-[14px] text-white leading-snug font-medium">{item.headline}</p>

                {item.body && (
                  <p className="mt-1.5 text-[12px] text-white/60 leading-relaxed pr-16">{item.body}</p>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(item.id); }}
                  className="absolute bottom-3 right-4 text-[9px] uppercase tracking-[0.2em] text-white/15 hover:text-white/40 transition-colors"
                >
                  dismiss
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
