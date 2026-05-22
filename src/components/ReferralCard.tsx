import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/GlassPanel";
import { toast } from "sonner";
import { Copy, Users, Share2 } from "lucide-react";

export function ReferralCard() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [bonusScans, setBonusScans] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("profiles")
        .select("referral_code, bonus_scans")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("referrals")
        .select("id", { count: "exact" })
        .eq("referrer_user_id", user.id),
    ]).then(async ([profile, refs]) => {
      setBonusScans((profile.data as { bonus_scans?: number } | null)?.bonus_scans ?? 0);
      setReferralCount(refs.count ?? 0);

      const existingCode = (profile.data as { referral_code?: string } | null)?.referral_code;
      if (existingCode) {
        setCode(existingCode);
      } else {
        const { data } = await supabase.rpc("generate_referral_code", {
          p_user_id: user.id,
        });
        setCode(data as string | null);
      }
      setLoading(false);
    });
  }, [user]);

  const shareUrl = `https://perception-prism-project.lovable.app/auth?ref=${code ?? ""}`;

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied. Share it with someone who needs a read.");
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
      try {
        await (navigator as Navigator).share({
          title: "Mirror — See yourself the way the world sees you",
          text: "I've been using Mirror — it reads your behavioral patterns and tells you how you actually come across. Use my link and we both get 10 free scans.",
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  if (loading) return <div className="h-48 rounded-2xl glass animate-pulse" />;

  return (
    <GlassPanel className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A84C]">Invite a friend</p>
          <h3 className="font-display text-2xl text-gradient mt-1">Both get 10 free scans</h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-2">
            Share your link. When they sign up you both unlock 10 bonus scans.
          </p>
        </div>
        <div className="h-10 w-10 rounded-full bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4 text-[#C9A84C]" />
        </div>
      </div>

      {code && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-glass ring-hairline px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Your referral code</p>
            <p className="font-mono text-lg tracking-[0.2em] text-foreground mt-0.5">{code}</p>
          </div>
          <button
            onClick={copy}
            className="shrink-0 h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Copy referral link"
          >
            <Copy className="h-3.5 w-3.5 text-foreground/70" />
          </button>
        </div>
      )}

      {(referralCount > 0 || bonusScans > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {referralCount > 0 && (
            <div className="rounded-xl bg-glass ring-hairline px-3 py-2.5 text-center">
              <p className="font-display text-2xl text-[#C9A84C] tabular-nums">{referralCount}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mt-0.5">
                {referralCount === 1 ? "friend joined" : "friends joined"}
              </p>
            </div>
          )}
          {bonusScans > 0 && (
            <div className="rounded-xl bg-glass ring-hairline px-3 py-2.5 text-center">
              <p className="font-display text-2xl text-[#C9A84C] tabular-nums">{bonusScans}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mt-0.5">
                bonus scans earned
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={share}
        className="w-full rounded-full bg-foreground text-background py-3 text-[11px] uppercase tracking-[0.24em] glow-gold inline-flex items-center justify-center gap-2"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share Mirror
      </button>
    </GlassPanel>
  );
}
