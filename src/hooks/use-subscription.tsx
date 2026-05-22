import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Plan = "free" | "plus" | "elite";

export type SubscriptionState = {
  plan: Plan;
  loading: boolean;
  scanCount: number;
  scanLimit: number;
  scansRemaining: number;
  bonusScans: number;
  canScan: boolean;
  canAccessElite: boolean;
  canAccessPlus: boolean;
};

const LIMITS: Record<Plan, number> = {
  free: 3,
  plus: Infinity,
  elite: Infinity,
};

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [bonusScans, setBonusScans] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from("profiles")
        .select("bonus_scans")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([sub, scans, profile]) => {
      setPlan((sub.data?.plan as Plan) ?? "free");
      setScanCount(scans.count ?? 0);
      setBonusScans((profile.data as { bonus_scans?: number } | null)?.bonus_scans ?? 0);
      setLoading(false);
    });
  }, [user]);

  const scanLimit = LIMITS[plan];
  const effectiveLimit = scanLimit === Infinity ? Infinity : scanLimit + bonusScans;
  const scansRemaining = effectiveLimit === Infinity ? Infinity : Math.max(0, effectiveLimit - scanCount);
  const canScan = scansRemaining > 0;
  const canAccessPlus = plan === "plus" || plan === "elite";
  const canAccessElite = plan === "elite";

  return {
    plan,
    loading,
    scanCount,
    scanLimit,
    scansRemaining,
    bonusScans,
    canScan,
    canAccessElite,
    canAccessPlus,
  };
}
