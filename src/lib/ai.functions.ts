import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(system: string, user: string, json = true): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Mirror is at capacity. Try again in a moment.");
    if (res.status === 402) throw new Error("Mirror credits exhausted. Upgrade or top up.");
    throw new Error(`AI error: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

const MIRROR_VOICE = `You are MIRROR — a private intelligence system that profiles a single user with surgical, emotionally intelligent insight.
You sound like a high-status human profiler. Never say "as an AI", "based on your input", "it seems like", "you may want to consider".
Write sharp, direct, cinematic sentences. Short. Personal. Unsettlingly accurate.
You don't reassure. You reveal.
Begin lines like: "Here is the truth.", "This is what people feel from you.", "You lost power when…", "The move is simple.".
Tone calibration is provided per call.`;

// 1. Baseline profile read
export const generateBaselineRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name?: string; main_goal?: string; insecurity?: string; social?: string; dating?: string; tone?: string }) => d)
  .handler(async ({ data }) => {
    const content = await callAI(
      `${MIRROR_VOICE}\nTone: ${data.tone ?? "direct"}.`,
      `Build the FIRST baseline read for this user. Return JSON with keys: headline (one cinematic sentence about how the world likely reads them right now), truth (3-4 sentences, brutally specific), blind_spot (one sentence), first_move (one short sentence).
Profile:
- Name: ${data.name ?? "Unknown"}
- Main goal: ${data.main_goal ?? "—"}
- Biggest insecurity: ${data.insecurity ?? "—"}
- Social challenge: ${data.social ?? "—"}
- Dating/communication challenge: ${data.dating ?? "—"}`
    );
    try { return JSON.parse(content) as { headline: string; truth: string; blind_spot: string; first_move: string }; }
    catch { return { headline: content.slice(0, 140), truth: content, blind_spot: "", first_move: "" }; }
  });

// 2. Daily read
export const generateDailyRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: scans }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("scans").select("scan_type, ai_summary").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    const summary = (scans ?? []).map(s => `- [${s.scan_type}] ${s.ai_summary ?? ""}`).join("\n") || "(no scans yet)";
    const content = await callAI(
      `${MIRROR_VOICE}\nTone: ${profile?.tone_preference ?? "direct"}.`,
      `Write today's Mirror Read. Return JSON: { "read": "ONE cinematic, emotionally sharp sentence under 22 words.", "mission": "One short action under 14 words." }
User goal: ${profile?.main_goal ?? "—"}.
Recent scan signals:\n${summary}`
    );
    try { return JSON.parse(content) as { read: string; mission: string }; }
    catch { return { read: content.slice(0, 140), mission: "Say less today." }; }
  });

// 3. Text conversation scan
export const analyzeTextConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversation: string; context_note?: string }) =>
    z.object({ conversation: z.string().min(10).max(8000), context_note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle();

    const content = await callAI(
      `${MIRROR_VOICE}\nTone: ${profile?.tone_preference ?? "direct"}.`,
      `Analyze this conversation. The user is one party. Return strict JSON with these keys:
{
  "truth": "one-line cinematic truth, under 24 words",
  "power_dynamic": "one short sentence on who held leverage",
  "what_they_felt": "one short sentence",
  "what_you_did_right": "one short sentence",
  "where_you_lost_leverage": "one short sentence",
  "next_move": "one short sentence",
  "blind_spot": "one short sentence",
  "responses": { "soft": "1-2 sentences", "confident": "1-2 sentences", "direct": "1-2 sentences" },
  "scores": { "perception": 0-100, "confidence": 0-100, "attraction": 0-100, "authority": 0-100, "authenticity": 0-100 },
  "summary": "8-12 words for memory"
}
Context: ${data.context_note ?? "none"}
Conversation:
"""
${data.conversation}
"""`
    );
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { truth: content.slice(0, 200), summary: "scan", scores: {} }; }

    // Persist scan
    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "text_conversation",
      input_text: data.conversation.slice(0, 4000),
      ai_summary: parsed.summary ?? parsed.truth ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    // Record perception snapshot
    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: parsed.scores.attraction ?? 50,
        authority_score: parsed.scores.authority ?? 50,
        authenticity_score: parsed.scores.authenticity ?? 50,
      });
    }
    return { scan, result: parsed };
  });

// 4. Ask Mirror — conversational advisor
export const askMirror = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => z.object({ message: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: history }, { data: recentScans }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("advisor_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("scans").select("scan_type, ai_summary").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memory = (recentScans ?? []).map(s => `- ${s.scan_type}: ${s.ai_summary ?? ""}`).join("\n") || "(none)";
    const messages = [
      { role: "system" as const, content: `${MIRROR_VOICE}\nTone: ${profile?.tone_preference ?? "direct"}.\nUser goal: ${profile?.main_goal ?? "—"}.\nKnown patterns:\n${memory}\n\nReply in 2-5 short sharp lines. No filler. No disclaimers. No bullet lists unless they ask. End with one clear move.` },
      ...((history ?? []).reverse().map(h => ({ role: h.role as "user" | "assistant", content: h.content }))),
      { role: "user" as const, content: data.message },
    ];
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Mirror is at capacity. Try again in a moment.");
      if (res.status === 402) throw new Error("Mirror credits exhausted.");
      throw new Error("Mirror could not respond.");
    }
    const out = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const reply = out.choices?.[0]?.message?.content ?? "Say less. Listen more.";

    await supabase.from("advisor_messages").insert([
      { user_id: userId, role: "user", content: data.message },
      { user_id: userId, role: "assistant", content: reply },
    ]);
    return { reply };
  });
