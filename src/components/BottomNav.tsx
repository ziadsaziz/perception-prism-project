import { Link, useLocation } from "@tanstack/react-router";
import { Home, ScanLine, Sparkles, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/contacts", label: "People", icon: Users },
  { to: "/advisor", label: "Mirror", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("daily_reads")
      .select("seen")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        setHasNew(!data || !data.seen);
      });
  }, [user, pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3 pb-3 pt-2">
        <div className="bg-glass shadow-glass ring-hairline rounded-full px-1.5 py-1.5 flex items-center justify-between">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            const showDot = to === "/home" && hasNew && !active;
            return (
              <Link
                key={to}
                to={to}
                className="relative flex flex-col items-center justify-center flex-1 py-2 rounded-full transition-colors"
              >
                {active && (
                  <span aria-hidden className="absolute inset-1 rounded-full bg-secondary/80 ring-hairline" />
                )}
                <div className="relative">
                  <Icon className={`h-[18px] w-[18px] ${active ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <span className={`relative mt-0.5 text-[9px] tracking-[0.14em] uppercase ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
