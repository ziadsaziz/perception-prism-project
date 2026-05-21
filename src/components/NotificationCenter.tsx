import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X } from "lucide-react";
import { GlassPanel } from "@/components/GlassPanel";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

const TYPE_COLOR: Record<string, string> = {
  weekly_report: "text-[#C9A84C]",
  daily_read: "text-accent",
  pattern: "text-blue-400",
  blind_spot: "text-red-400/80",
  score_shift: "text-[#C9A84C]",
  milestone: "text-green-400",
};

const TYPE_LABEL: Record<string, string> = {
  weekly_report: "Weekly report",
  daily_read: "Daily read",
  pattern: "Pattern detected",
  blind_spot: "Blind spot",
  score_shift: "Score shift",
  milestone: "Milestone",
};

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data ?? []);
      setUnread((data ?? []).filter(n => !n.read).length);
    })();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          setNotifications(n => [payload.new as Notification, ...n]);
          setUnread(u => u + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnread(0);
  };

  const dismiss = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (unread > 0) markAllRead();
        }}
        className="relative h-9 w-9 rounded-full bg-glass ring-hairline flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-foreground/80" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[#C9A84C] text-background text-[9px] font-medium flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md h-full bg-background/95 backdrop-blur-2xl border-l border-white/[0.06] overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl px-5 pt-6 pb-4 border-b border-white/[0.04]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</p>
                  <h2 className="font-display text-3xl text-gradient mt-1">Notifications.</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-full bg-glass ring-hairline flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-foreground/70" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-2">
              {notifications.length === 0 ? (
                <GlassPanel className="p-8 text-center space-y-2">
                  <p className="font-display text-xl text-gradient">All clear.</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mirror will surface insights here as they emerge.
                  </p>
                </GlassPanel>
              ) : (
                notifications.map(n => (
                  <GlassPanel key={n.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-[9px] uppercase tracking-[0.28em] ${TYPE_COLOR[n.type] ?? "text-muted-foreground"}`}>
                            {TYPE_LABEL[n.type] ?? n.type}
                          </p>
                          <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground/50">
                            {formatTime(n.created_at)}
                          </p>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                          )}
                        </div>
                        <p className="text-sm text-foreground/95 leading-snug">{n.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{n.body}</p>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="shrink-0 mt-0.5 text-white/20 hover:text-white/50 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
