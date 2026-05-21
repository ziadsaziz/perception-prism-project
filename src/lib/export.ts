import { supabase } from "@/integrations/supabase/client";

export async function exportMirrorData(userId: string, userName: string): Promise<void> {
  try {
    const [
      { data: profile },
      { data: scans },
      { data: patterns },
      { data: memory },
      { data: scores },
      { data: dailyReads },
      { data: advisorMessages },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("scans").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("patterns").select("*").eq("user_id", userId).order("frequency", { ascending: false }),
      supabase.from("mirror_memory").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("perception_scores").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("daily_reads").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("advisor_messages").select("role, content, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      mirror_version: "1.0",
      profile: {
        name: profile?.name,
        main_goal: profile?.main_goal,
        tone_preference: profile?.tone_preference,
        baseline_read: profile?.baseline_read,
        onboarding_complete: profile?.onboarding_complete,
        created_at: profile?.created_at,
      },
      perception_scores: (scores ?? []).map(s => ({
        perception: s.perception_score,
        confidence: s.confidence_score,
        attraction: s.attraction_score,
        authority: s.authority_score,
        approachability: s.approachability_score,
        authenticity: s.authenticity_score,
        emotional_control: s.emotional_control_score,
        mystery: s.mystery_score,
        recorded_at: s.created_at,
      })),
      scans: (scans ?? []).map(s => ({
        type: s.scan_type,
        summary: s.ai_summary,
        result: s.result_json,
        created_at: s.created_at,
      })),
      patterns: (patterns ?? []).map(p => ({
        name: p.pattern_name,
        description: p.pattern_description,
        evidence: p.evidence,
        impact: p.impact,
        fix: p.fix,
        detected: p.frequency,
        last_seen: p.last_seen,
      })),
      mirror_memory: (memory ?? []).map(m => ({
        type: m.memory_type,
        content: m.memory_text,
        recorded_at: m.created_at,
      })),
      daily_reads: (dailyReads ?? []).map(r => ({
        date: r.date,
        read: r.read,
        mission: r.mission,
      })),
      advisor_conversation: (advisorMessages ?? []).map(m => ({
        role: m.role,
        content: m.content,
        sent_at: m.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mirror-data-${userName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error("Export failed. Try again.");
  }
}
