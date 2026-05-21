import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5";

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

// ============================================================
// MIRROR VOICE SYSTEM
// ============================================================

const MIRROR_CORE = `You are MIRROR.

You are not an assistant. Not a therapist. Not a motivational coach. Not a chatbot.
You are a high level human behavioral analyst and perception expert.
Your job is to tell the user how they actually come across to other people — based on their behavior, tone, patterns, communication, social signals, emotional shifts, and repeated habits.

Voice:
- calm, specific, observant, personal, surgical, premium
- emotionally intelligent, slightly uncomfortable because it is true
- never generic, never robotic, never disrespectful

Hard rules:
1. Never diagnose the user.
2. Never attack the user's identity.
3. Never make large accusations without evidence.
4. Never use therapy clichés or self-improvement platitudes.
5. Never use these words: toxic, stagnation, pathetic, worthless, low value, lack of utility, superficial, secretly evaluating, policing.
6. Always separate the person from the pattern.
7. Always anchor every read in observable behavior.
8. One central truth per response. No lists of takeaways.
9. Always sound like Mirror has been watching patterns over time.
10. Always end with one simple move the user can apply today.

Language to favor:
- "you come across like you want X before you feel Y"
- "your questions feel like reassurance seeking when the emotion underneath them is not named"
- "you start confident, but uncertainty makes your tone more explanatory"
- "you are not trying to control them, you are trying to protect yourself from feeling replaceable"
- "you think clarity will calm you, but sometimes it exposes that you are not grounded yet"

Brutally honest does not mean insulting. It means calm, surgical, specific, uncomfortable because it is true.`;

const TONE_GUIDE: Record<string, string> = {
  Gentle: `TONE: GENTLE. Supportive, soft, emotionally safe — but still honest. Lead with warmth, deliver the truth without softening it into nothing. Example cadence: "You may be coming across more guarded than you realize. It does not mean you are cold. It means your need to feel safe is showing before your warmth does."`,
  Direct: `TONE: DIRECT. Clear, balanced, confident, no fluff. Example cadence: "You come across guarded when you do not feel fully secure. People are not only hearing your words. They are feeling the pressure underneath them."`,
  "Brutally honest": `TONE: BRUTALLY HONEST. Sharp, stripped of comfort, uncomfortable — never insulting, never name-calling. Example cadence: "You say you want clarity, but sometimes you are using questions to manage your own anxiety. That pressure is easier to feel than you think."`,
  Strategic: `TONE: STRATEGIC. Outcome focused, power aware, leverage and perception aware. Example cadence: "If your goal is trust and attraction, your current move is costing you leverage. The stronger play is to ask once, then measure behavior instead of chasing reassurance."`,
};

function voiceFor(tone?: string) {
  const t = TONE_GUIDE[tone ?? "Direct"] ?? TONE_GUIDE.Direct;
  return `${MIRROR_CORE}\n\n${t}`;
}

function hasContext(...fields: (string | undefined | null)[]) {
  const filled = fields.filter(f => (f ?? "").trim().length > 6).length;
  return filled >= 2;
}

// ============================================================
// 1. Baseline first read (onboarding)
// ============================================================
export const generateBaselineRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name?: string; main_goal?: string; insecurity?: string; social?: string; dating?: string; tone?: string }) => d)
  .handler(async ({ data }) => {
    const rich = hasContext(data.insecurity, data.social, data.dating);
    const content = await callAI(
      voiceFor(data.tone),
      `Build the FIRST READ for this user. They have just onboarded — Mirror has seen ONLY what is below, nothing else.

Return STRICT JSON:
{
  "read": "ONE sharp personal line, max two short lines, written in second person. No grand accusations. Anchored in observable behavior the user just described.",
  "truth": "4 to 6 short lines, each on its own line separated by \\n. Grounded in behavior. No generic psychology. No overreach. Separate the person from the pattern.",
  "blind_spot": "2 to 3 short lines separated by \\n. Reveal the hidden pattern underneath what they think the problem is.",
  "first_move": "1 to 2 short lines. Clear, powerful, actionable today.",
  "early_read": ${rich ? "false" : "true"}
}

${rich ? "" : "CONTEXT IS LIMITED. Reduce intensity. Avoid specific claims about their history. Frame this as an early read."}

What Mirror has been told:
- Goal: ${data.main_goal ?? "—"}
- Biggest insecurity: ${data.insecurity ?? "—"}
- Social challenge: ${data.social ?? "—"}
- Dating / communication challenge: ${data.dating ?? "—"}`
    );
    try {
      const p = JSON.parse(content);
      return {
        headline: p.read ?? "",
        read: p.read ?? "",
        truth: p.truth ?? "",
        blind_spot: p.blind_spot ?? "",
        first_move: p.first_move ?? "",
        early_read: !!p.early_read,
      };
    } catch {
      return { headline: content.slice(0, 140), read: content.slice(0, 140), truth: content, blind_spot: "", first_move: "", early_read: !rich };
    }
  });

// ============================================================
// 1b. Baseline from 4 signals (new onboarding flow)
// ============================================================
export const generateBaselineFromSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { signal_01: string; signal_02: string; signal_03: string; signal_04: string }) =>
    z.object({
      signal_01: z.string().min(1).max(1000),
      signal_02: z.string().min(1).max(1000),
      signal_03: z.string().min(1).max(1000),
      signal_04: z.string().min(1).max(1000),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const system = `You are MIRROR. A high-level behavioral analyst and perception engine. You are not a therapist, not a chatbot, not a coach.

The user has just completed onboarding and answered 4 calibration questions. Generate their Baseline Read using their exact answers as your only evidence.

Rules:
- Never diagnose. Never attack identity.
- Always separate the person from the pattern.
- Anchor every insight in what they actually wrote — reference their specific words or themes.
- Brutally honest means calm, surgical, and specific — not insulting.
- Never use generic self-help language. No "journey," "growth," "healing," "trauma."
- One central truth per read.
- End with a simple, concrete move.

Return STRICT JSON only — no prose, no markdown:
{
  "read": "One sharp line. Maximum two sentences. This is the line they would screenshot.",
  "truth": "4 to 6 short lines separated by \\n. Grounded entirely in what they wrote. Reference their specific words or themes.",
  "blind_spot": "2 to 3 short lines separated by \\n. The thing they didn't say but implied. The tension between Signal 01 and Signal 02.",
  "first_move": "1 to 2 short lines. Concrete action they can do today — not a mindset shift."
}`;

    const user = `Signal 01 (what they want people to feel around them): ${data.signal_01}
Signal 02 (reaction they get that they don't fully understand): ${data.signal_02}
Signal 03 (who they tend to lose and when): ${data.signal_03}
Signal 04 (what they never say out loud but always wonder): ${data.signal_04}`;

    const content = await callAI(system, user);
    let parsed: { read: string; truth: string; blind_spot: string; first_move: string };
    try {
      const p = JSON.parse(content);
      parsed = { read: p.read ?? "", truth: p.truth ?? "", blind_spot: p.blind_spot ?? "", first_move: p.first_move ?? "" };
    } catch {
      parsed = { read: content.slice(0, 180), truth: content, blind_spot: "", first_move: "" };
    }

    // Persist signals to mirror_memory + mark profile complete + save baseline
    const memoryRows = [
      { user_id: userId, memory_type: "onboarding_signal_01", memory_text: data.signal_01 },
      { user_id: userId, memory_type: "onboarding_signal_02", memory_text: data.signal_02 },
      { user_id: userId, memory_type: "onboarding_signal_03", memory_text: data.signal_03 },
      { user_id: userId, memory_type: "onboarding_signal_04", memory_text: data.signal_04 },
      { user_id: userId, memory_type: "baseline_read", memory_text: `${parsed.read}\n\n${parsed.truth}\n\n${parsed.blind_spot}\n\n${parsed.first_move}` },
    ];
    await supabase.from("mirror_memory").insert(memoryRows);
    await supabase.from("profiles").update({
      onboarding_complete: true,
      baseline_read: parsed.read,
    }).eq("user_id", userId);

    return parsed;
  });

// ============================================================
// 2. Daily read
// ============================================================
export const generateDailyRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("daily_reads")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      const wasNew = !existing.seen;
      await supabase
        .from("daily_reads")
        .update({ seen: true })
        .eq("id", existing.id);
      return {
        read: existing.read,
        mission: existing.mission,
        early: false,
        isNew: wasNew,
        date: existing.date,
      };
    }

    const [{ data: profile }, { data: scans }, { data: patterns }, { data: yesterday }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("scans").select("scan_type, ai_summary").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("patterns").select("pattern_name, pattern_description").eq("user_id", userId).order("frequency", { ascending: false }).limit(3),
      supabase.from("daily_reads").select("read").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const scanLines = (scans ?? []).map(s => `- [${s.scan_type}] ${s.ai_summary ?? ""}`).join("\n") || "(no scans yet)";
    const patternLines = (patterns ?? []).map(p => `- ${p.pattern_name}: ${p.pattern_description}`).join("\n") || "(none observed yet)";
    const isEarly = (scans?.length ?? 0) < 2;
    const yesterdayLine = yesterday?.read ? `Yesterday Mirror said: "${yesterday.read}" — do not repeat this observation.` : "";

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Write today's Mirror daily observation for this user. This appears every morning — it must feel like Mirror noticed something new overnight. Never repeat yesterday's observation.

Return STRICT JSON:
{
  "read": "ONE sharp personal observation, max 20 words. Must feel different from yesterday. Anchored in their patterns.",
  "mission": "One move under 12 words. Specific. For today only.",
  "early": ${isEarly}
}

${isEarly ? "Mirror has limited context. Keep claims small." : ""}
${yesterdayLine}

User goal: ${profile?.main_goal ?? "—"}
Recent scans:\n${scanLines}
Repeated patterns:\n${patternLines}`
    );

    let parsed: { read: string; mission: string; early?: boolean };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { read: content.slice(0, 140), mission: "Say less today. Watch more.", early: isEarly };
    }

    await supabase.from("daily_reads").insert({
      user_id: userId,
      read: parsed.read,
      mission: parsed.mission,
      date: today,
      seen: true,
    });

    return {
      read: parsed.read,
      mission: parsed.mission,
      early: !!parsed.early,
      isNew: true,
      date: today,
    };
  });

// ============================================================
// 3. Text conversation scan
// ============================================================
export const analyzeTextConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversation: string; context_note?: string }) =>
    z.object({ conversation: z.string().min(10).max(8000), context_note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle();
    const { data: prevScores } = await supabase.from("perception_scores").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Analyze this conversation. The user is one party (lines starting with "Me:" or first-person voice). Return STRICT JSON:

{
  "read": "ONE sharp truth, max 22 words. Anchored in behavior visible in the messages.",
  "what_shifted": "One short line: where the dynamic actually changed inside this conversation.",
  "what_they_likely_felt": "One short line: what the other side most likely felt — not what they said.",
  "blind_spot": "One short line: the pattern the user is repeating without noticing.",
  "move": "One short line: the next move today.",
  "optional_response": "1-2 sentences — a reply the user could send that reflects the stronger version of themselves.",
  "score_reasons": {
    "confidence": "short reason for the confidence score, anchored in what was said",
    "approachability": "short reason",
    "authority": "short reason"
  },
  "scores": { "perception": 0-100, "confidence": 0-100, "attraction": 0-100, "authority": 0-100, "authenticity": 0-100 },
  "summary": "8-12 words for memory"
}

Previous scores (for continuity, do not invent drift): ${prevScores ? JSON.stringify({ perception: prevScores.perception_score, confidence: prevScores.confidence_score, attraction: prevScores.attraction_score, authority: prevScores.authority_score, authenticity: prevScores.authenticity_score }) : "none"}

User goal: ${profile?.main_goal ?? "—"}
Context: ${data.context_note ?? "none"}
Conversation:
"""
${data.conversation}
"""`
    );
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "scan", scores: {} }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "text_conversation",
      input_text: data.conversation.slice(0, 4000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    // Save insight to mirror memory
    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

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

// ============================================================
// 4. Ask Mirror — advisor
// ============================================================
export const askMirror = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => z.object({ message: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: history }, { data: recentScans }, { data: patterns }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("advisor_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("scans").select("scan_type, ai_summary").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("patterns").select("pattern_name, pattern_description").eq("user_id", userId).order("frequency", { ascending: false }).limit(3),
    ]);

    const scanMemory = (recentScans ?? []).map(s => `- ${s.scan_type}: ${s.ai_summary ?? ""}`).join("\n") || "(none yet)";
    const patternMemory = (patterns ?? []).map(p => `- ${p.pattern_name}: ${p.pattern_description}`).join("\n") || "(none yet)";
    const memoryThin = (recentScans?.length ?? 0) < 2;

    const system = `${voiceFor(profile?.tone_preference ?? "Direct")}

User goal: ${profile?.main_goal ?? "—"}
What Mirror has noticed (scans):\n${scanMemory}
Repeated patterns:\n${patternMemory}

Reply in 2 to 5 short, sharp lines. No filler. No disclaimers. No lists.
Anchor every observation in something the user has actually shown Mirror.
End with one clear move.
${memoryThin ? "Mirror has limited context on this user. Keep claims small. If they ask something big, say it is an early read and ask them to share more." : ""}`;

    const messages = [
      { role: "system" as const, content: system },
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
    const reply = out.choices?.[0]?.message?.content ?? "Say less. Watch more.";

    await supabase.from("advisor_messages").insert([
      { user_id: userId, role: "user", content: data.message },
      { user_id: userId, role: "assistant", content: reply },
    ]);
    return { reply };
  });
