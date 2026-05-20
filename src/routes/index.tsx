import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { DemoScan } from "@/components/DemoScan";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/home" }); }, [user, loading, nav]);

  return (
    <main className="relative min-h-screen bg-black">
      <section className="relative min-h-screen flex flex-col px-6 pt-16 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full ring-hairline bg-glass flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-foreground animate-pulse-soft" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.32em]">Mirror</span>
          </div>
          <Link to="/auth" className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sign in</Link>
        </div>

        <div className="flex-1 flex flex-col justify-center -mt-6 animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Private intelligence</p>
          <h1 className="mt-4 font-display text-[44px] leading-[1.02] tracking-tight text-gradient">
            See yourself<br/>the way<br/>the world sees you.
          </h1>
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-[28ch]">
            Most people never know how they actually come across. Mirror studies the signals people feel — but rarely say out loud.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "You are not invisible. You are unread.",
              "Your blind spots cost you attraction, trust, and influence.",
              "Mirror does not tell you who you are. It shows you how you are received.",
            ].map((line, i) => (
              <div key={i} className="bg-glass ring-hairline rounded-2xl px-4 py-3 text-[13px] text-foreground/85 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DemoScan />

      <section className="px-6 pb-10 pt-4">
        <Link to="/auth" search={{ mode: "signup" }} className="group relative overflow-hidden rounded-full px-6 py-4 bg-foreground text-background flex items-center justify-between glow-gold max-w-[680px] mx-auto">
          <span className="text-xs uppercase tracking-[0.24em] font-medium">Enter Mirror</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Private. Encrypted. Dark by design.</p>
      </section>
    </main>
  );
}
