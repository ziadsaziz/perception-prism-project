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
  trialScans: { selfie: boolean; voice: boolean; social: boolean };
  canTrialSelfie: boolean;
  canTrialVoice: boolean;
  canTrialSocial: boolean;
};

const LIMITS: Record<Plan, number> = {
  free: 20,
  plus: Infinity,
  elite: Infinity,
};

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [bonusScans, setBonusScans] = useState(0);
  const [trialScans, setTrialScans] = useState({
    selfie: false,
    voice: false,
    social: false,
  });

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
        .select("bonus_scans, trial_selfie_used, trial_voice_used, trial_social_used")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([sub, scans, profile]) => {
      setPlan((sub.data?.plan as Plan) ?? "free");
      setScanCount(scans.count ?? 0);
      const p = profile.data as { bonus_scans?: number; trial_selfie_used?: boolean; trial_voice_used?: boolean; trial_social_used?: boolean } | null;
      setBonusScans(p?.bonus_scans ?? 0);
      setTrialScans({
        selfie: p?.trial_selfie_used ?? false,
        voice: p?.trial_voice_used ?? false,
        social: p?.trial_social_used ?? false,
      });
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
    trialScans,
    canTrialSelfie: !trialScans.selfie || canAccessElite,
    canTrialVoice: !trialScans.voice || canAccessElite,
    canTrialSocial: !trialScans.social || canAccessElite,
  };
}
