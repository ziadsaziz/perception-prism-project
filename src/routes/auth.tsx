import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).optional() }),
  component: Auth,
});

function Auth() {
  const { mode: initMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (user) nav({ to: "/home" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
        toast.success("Welcome to Mirror.");
        // If session exists immediately (email confirmation disabled), route directly
        if (data.session) {
          nav({ to: "/onboarding" });
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Check if onboarding is complete — if not, send them there
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (!profile?.onboarding_complete) {
          nav({ to: "/onboarding" });
        } else {
          nav({ to: "/home" });
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? "Could not authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen px-6 pt-12 pb-10 flex flex-col">
      <Link to="/" className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">← Back</Link>

      <div className="mt-12 animate-fade-up">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{mode === "signup" ? "Create your Mirror" : "Return to Mirror"}</p>
        <h1 className="mt-3 font-display text-4xl text-gradient leading-tight">
          {mode === "signup" ? "Begin being read." : "Continue being read."}
        </h1>
      </div>

      <form onSubmit={submit} className="mt-10 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Email</label>
          <input
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            className="mt-2 w-full bg-glass ring-hairline rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Password</label>
          <input
            type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password} onChange={e => setPassword(e.target.value)}
            className="mt-2 w-full bg-glass ring-hairline rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-2 rounded-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] glow-gold disabled:opacity-50">
          {loading ? "Reading…" : (mode === "signup" ? "Create account" : "Sign in")}
        </button>
      </form>

      <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        className="mt-8 text-center text-[11px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
        {mode === "signup" ? "Already have an account?" : "First time? Create your Mirror"}
      </button>

      <p className="mt-auto pt-8 text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        Private. End-to-end. Yours alone.
      </p>
    </main>
  );
}
