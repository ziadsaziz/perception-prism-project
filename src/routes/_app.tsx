import { createFileRoute, useNavigate, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_app")({ component: AppShell });

function AppShell() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    supabase.from("profiles").select("onboarding_complete").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.onboarding_complete) nav({ to: "/onboarding" });
      else setChecked(true);
    });
  }, [user, loading, nav]);

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground animate-pulse-soft">Mirror loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen pb-28">
      <Outlet />
      <BottomNav />
    </div>
  );
}
