import { Link, useLocation } from "@tanstack/react-router";
import { Home, ScanLine, Waves, TrendingUp, Sparkles, User } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/patterns", label: "Patterns", icon: Waves },
  { to: "/evolution", label: "Evolve", icon: TrendingUp },
  { to: "/advisor", label: "Mirror", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3 pb-3 pt-2">
        <div className="bg-glass shadow-glass ring-hairline rounded-full px-1.5 py-1.5 flex items-center justify-between">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="relative flex flex-col items-center justify-center flex-1 py-2 rounded-full transition-colors"
              >
                {active && (
                  <span aria-hidden className="absolute inset-1 rounded-full bg-secondary/80 ring-hairline" />
                )}
                <Icon className={`relative h-[18px] w-[18px] ${active ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />
                <span className={`relative mt-0.5 text-[9px] tracking-[0.14em] uppercase ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
