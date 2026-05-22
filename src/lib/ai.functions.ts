import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// daily_checkins table exists in DB — reserved for future daily mood check-in feature


const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5";

async function callAI(system: string, user: string, json = true, maxTokens = 800): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: maxTokens,
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

async function extractTextFromImage(imageBase64: string): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all the text from this conversation screenshot. Format it exactly like this:

Them: [their message]
Me: [my message]
Them: [their message]

Rules:
- Preserve the exact order of messages
- Label each message as either "Me:" or "Them:"
- If you cannot tell who sent which message, use "Person 1:" and "Person 2:"
- Include timestamps only if they are clearly visible and relevant
- Do not add any commentary or explanation — only the extracted conversation
- If this is not a conversation screenshot, say: NOT_A_CONVERSATION`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error("Screenshot extraction failed.");
  const out = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = out.choices?.[0]?.message?.content ?? "";
  if (text.includes("NOT_A_CONVERSATION")) throw new Error("This doesn't look like a conversation screenshot.");
  return text;
}

export const extractConversationFromScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { image_base64: string }) =>
    z.object({ image_base64: z.string().min(100) }).parse(d))
  .handler(async ({ data }) => {
    const text = await extractTextFromImage(data.image_base64);
    return { text };
  });



async function createNotification(
  supabase: any,
  userId: string,
  type: string,
  title: string,
  body: string
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
    });
  } catch {
    // Non-blocking — never fail a scan because of a notification error
  }
}

async function checkStreakMilestone(supabase: any, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("current_streak")
    .eq("user_id", userId)
    .maybeSingle();

  const streak = data?.current_streak ?? 0;
  const milestones = [3, 7, 14, 21, 30, 60, 100];

  if (milestones.includes(streak)) {
    const msgs: Record<number, [string, string]> = {
      3:   ["3-day streak.", "Three consecutive days. Mirror is starting to see patterns."],
      7:   ["7-day streak.", "One week. Most people quit before this. You didn't."],
      14:  ["14-day streak.", "Two weeks. Your Mirror profile is the sharpest it's ever been."],
      21:  ["21-day streak.", "21 days. This is a habit now. Mirror knows how you move."],
      30:  ["30 days.", "One month in. Mirror knows you better than most people in your life."],
      60:  ["60-day streak.", "Two months. You're in the top 1% of Mirror users."],
      100: ["100 days.", "Mirror has a complete picture of who you are. This is rare."],
    };
    const [title, body] = msgs[streak] ?? ["Streak milestone.", "Keep going."];
    await createNotification(supabase, userId, "milestone", title, body);
  }
}

function computeMirrorScore(scores: any): number {
  if (!scores) return 0;
  return Math.min(1000, Math.round((
    (scores.perception ?? 50) * 0.20 +
    (scores.confidence ?? 50) * 0.15 +
    (scores.attraction ?? 50) * 0.13 +
    (scores.authority ?? 50) * 0.12 +
    (scores.approachability ?? 50) * 0.10 +
    (scores.authenticity ?? 50) * 0.12 +
    (scores.emotional_control ?? 50) * 0.10 +
    (scores.mystery ?? 50) * 0.08
  ) * 10));
}

async function checkMirrorScoreMilestone(supabase: any, userId: string, newScore: number) {
  const milestones = [300, 500, 700, 900];
  const { data: prev } = await supabase
    .from("perception_scores")
    .select("mirror_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (!prev || prev.length < 2) return;
  const prevScore = prev[1].mirror_score ?? 0;

  for (const m of milestones) {
    if (prevScore < m && newScore >= m) {
      const labels: Record<number, string> = {
        300: "Developing",
        500: "Aware",
        700: "Sharp",
        900: "Commanding",
      };
      await createNotification(
        supabase, userId,
        "milestone",
        `Mirror Score: ${newScore} — ${labels[m]}`,
        `You crossed ${m}. Mirror has been watching this build.`
      );
      break;
    }
  }
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
11. Always anchor every read in at least one specific thing the user provided. Never make a claim that could apply to anyone. If you cannot anchor the read in something specific, say less.
12. Always frame reads as perception, not identity. Never say "you are X." Always say "you come across as X" or "people read this as X" or "this lands as X." Mirror reads how others perceive — not who someone fundamentally is.
13. Context changes everything. If the user provides context about the situation, relationship, or environment — weight it heavily. The same behavior reads differently in different contexts. A direct tone in a negotiation reads as strong. The same tone in a first date reads as cold. Always factor context into the read.
14. Positive reads are as valuable as corrections. If the behavior is working — if the text landed well, the post is strong, the decision is correct, the presence is magnetic — say so clearly and specifically. Tell them what worked and why, so they can repeat it. Never manufacture a problem when the evidence shows strength. Confirmation is intelligence too.

Language to favor:
- "you come across like you want X before you feel Y"
- "your questions feel like reassurance seeking when the emotion underneath them is not named"
- "you start confident, but uncertainty makes your tone more explanatory"
- "you are not trying to control them, you are trying to protect yourself from feeling replaceable"
- "you think clarity will calm you, but sometimes it exposes that you are not grounded yet"
- "to someone who doesn't know you yet, this reads as X — that may not be who you are, but it is what they feel"
- "in this context, this actually landed exactly the way you intended — here is what made it work"
- "this comes across as X in most situations — but given what you described, it likely reads differently here"
- "the signal this sends depends on who is receiving it — Mirror is reading the most common interpretation"
- "this is working — the reason it works is X — keep doing this"

Brutally honest does not mean insulting. It means calm, surgical, specific, uncomfortable because it is true.`;

const TRIAL_MODE_ADDENDUM = `

IMPORTANT — TRIAL MODE ACTIVE:
This is the user's first time experiencing this scan type. This read must be the most specific, most accurate, most uncomfortably true thing they have ever read about themselves from any AI. This is Mirror's one chance to prove itself.

Additional rules for trial mode:
- Go deeper than usual. Where a standard read gives 2-3 lines, give 4-5.
- Be more specific than usual. Reference exact details from what they provided.
- The blind spot must be something they have never consciously articulated before — something that feels like Mirror reached inside their head.
- The first move must be so specific and actionable they could do it in the next 10 minutes.
- End with one line that makes them feel Mirror knows them better than most people in their life do.
- Do not hold back. This is not a sample. This is the real Mirror at full power.`;

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
  .inputValidator((d: { signal_01: string; signal_02: string; signal_03: string; signal_04: string; tone_preference?: string }) =>
    z.object({
      signal_01: z.string().min(1).max(1000),
      signal_02: z.string().min(1).max(1000),
      signal_03: z.string().min(1).max(1000),
      signal_04: z.string().min(1).max(1000),
      tone_preference: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const system = `${voiceFor(data.tone_preference ?? "Direct")}

You are MIRROR. A high-level behavioral analyst and perception engine. You are not a therapist, not a chatbot, not a coach.

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
  .inputValidator((d: { mood?: string; energy?: number; happened?: string }) =>
    z.object({
      mood: z.string().optional(),
      energy: z.number().optional(),
      happened: z.string().optional(),
    }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
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

    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[now.getDay()];
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const { count: weekScanCount } = await supabase
      .from("scans")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString());

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Write today's Mirror daily observation for this user. This appears every morning — it must feel like Mirror noticed something new overnight. Never repeat yesterday's observation.

Return STRICT JSON:
{
  "read": "ONE sharp observation. Maximum 18 words. One idea only — never two clauses joined by a semicolon or comma. Simple sentence structure. Must be immediately understood on first read. No complex phrasing. Uncomfortable because it is true, not because it is hard to parse.",
  "mission": "One concrete action. Under 10 words. Start with a verb. No explanation.",
  "early": ${isEarly}
}

Temporal context:
- Today is ${dayOfWeek} ${timeOfDay}
- The user has run ${weekScanCount ?? 0} scans this week
- ${dayOfWeek === "Monday" ? "It is the start of the week. The read should feel like a reset — fresh, forward-looking." : ""}
- ${dayOfWeek === "Friday" || dayOfWeek === "Saturday" ? "It is the end of the week. The read can reflect on what the week surfaced." : ""}
- ${(weekScanCount ?? 0) === 0 ? "The user has not scanned this week. The read should gently invite them back." : ""}
- ${(weekScanCount ?? 0) >= 5 ? "The user has been very active this week. The read should acknowledge the pattern building." : ""}
${isEarly ? "Mirror has limited context. Keep claims small." : ""}
${yesterdayLine}

User goal: ${profile?.main_goal ?? "—"}
Recent scans:\n${scanLines}
Repeated patterns:\n${patternLines}
${data?.mood ? `
Current session context:
- Mood: ${data.mood}
- Energy level: ${data.energy ?? 3}/5
- What happened: ${data.happened ?? "nothing noted"}
Factor this into the read and the move. A user who is anxious needs a different read than one who is sharp. A user with low energy needs a different move than one who is charged.` : ""}`
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

    await supabase.rpc("update_user_streak", { p_user_id: userId });

    await createNotification(
      supabase, userId,
      "daily_read",
      "Your read is ready.",
      parsed.read?.slice(0, 120) ?? "Mirror has a new observation for you today."
    );

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
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text, memory_type").eq("user_id", userId).order("created_at", { ascending: false }).limit(7),
    ]);

    const memoryContext = (memory ?? [])
      .map(m => `- ${m.memory_text}`)
      .join("\n") || "(no prior observations)";
    const { data: prevScores } = await supabase.from("perception_scores").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Analyze this conversation. The user is one party (lines starting with "Me:" or first-person voice). Return STRICT JSON:

{
  "read": "ONE sharp truth, max 22 words. Anchored in behavior visible in the messages.",
  "what_shifted": "One short line: where the dynamic actually changed inside this conversation.",
  "what_they_likely_felt": "One short line: what the other side most likely felt — not what they said.",
  "blind_spot": "One short line: the pattern the user is repeating without noticing.",
  "what_is_working": "Optional. Only include if something is genuinely working well — a strong move, a well-landed message, confident energy. If present, 1-2 lines on what landed and why. If nothing stands out as working, omit this field entirely. Do not manufacture positives.",
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
IMPORTANT: If the user provided context above, let it meaningfully shape the read. The same words land differently in different relationships, situations, and cultures. A direct message to a close friend reads differently than the same message to a new contact. Weight the context heavily when forming the perception read.
Conversation:
"""
${data.conversation}
"""

What Mirror has observed about this user before:
${memoryContext}`
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

    // Return immediately — run all post-processing in background
    const result = { scan, result: parsed };

    // Fire and forget — don't block the user
    (async () => {
      try {
        if (parsed.scores) {
          const mirrorScore = Math.min(1000, Math.round((
            (parsed.scores.perception ?? 50) * 0.20 +
            (parsed.scores.confidence ?? 50) * 0.15 +
            (parsed.scores.attraction ?? 50) * 0.13 +
            (parsed.scores.authority ?? 50) * 0.12 +
            (parsed.scores.approachability ?? 50) * 0.10 +
            (parsed.scores.authenticity ?? 50) * 0.12 +
            (parsed.scores.emotional_control ?? 50) * 0.10 +
            (parsed.scores.mystery ?? 50) * 0.08
          ) * 10));
          await supabase.from("perception_scores").insert({
            user_id: userId,
            perception_score: parsed.scores.perception ?? 50,
            confidence_score: parsed.scores.confidence ?? 50,
            attraction_score: parsed.scores.attraction ?? 50,
            authority_score: parsed.scores.authority ?? 50,
            approachability_score: parsed.scores.approachability ?? 50,
            authenticity_score: parsed.scores.authenticity ?? 50,
            emotional_control_score: parsed.scores.emotional_control ?? 50,
            mystery_score: parsed.scores.mystery ?? 50,
            mirror_score: mirrorScore,
          });
          await checkMirrorScoreMilestone(supabase, userId, mirrorScore);
        }

        if (parsed.blind_spot) {
          await supabase.from("mirror_memory").insert({
            user_id: userId,
            memory_type: "scan_insight",
            memory_text: parsed.blind_spot,
          });
        }

        // Pattern detection
        const { data: recentScans } = await supabase
          .from("scans")
          .select("ai_summary, result_json")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentScans && recentScans.length >= 1) {
          const scanSummaries = recentScans
            .map(s => s.ai_summary ?? "")
            .filter(Boolean)
            .join("\n");

          const patternContent = await callAI(
            `You are MIRROR's pattern detection engine. Identify one recurring behavioral pattern. Return STRICT JSON only:
{
  "found": true or false,
  "pattern_name": "3-5 word name",
  "pattern_description": "2-3 lines",
  "evidence": "one line",
  "impact": "one line",
  "fix": "one behavioral shift"
}`,
            `Recent scan summaries:\n${scanSummaries}`
          );

          let patternParsed: any;
          try { patternParsed = JSON.parse(patternContent); } catch { patternParsed = null; }

          if (patternParsed?.found && patternParsed?.pattern_name) {
            const { data: existing } = await supabase
              .from("patterns")
              .select("id, frequency")
              .eq("user_id", userId)
              .eq("pattern_name", patternParsed.pattern_name)
              .maybeSingle();

            if (existing) {
              await supabase.from("patterns").update({
                frequency: (existing.frequency ?? 1) + 1,
                pattern_description: patternParsed.pattern_description,
                evidence: patternParsed.evidence,
                impact: patternParsed.impact,
                fix: patternParsed.fix,
                last_seen: new Date().toISOString(),
              }).eq("id", existing.id);
            } else {
              await supabase.from("patterns").insert({
                user_id: userId,
                pattern_name: patternParsed.pattern_name,
                pattern_description: patternParsed.pattern_description,
                evidence: patternParsed.evidence,
                impact: patternParsed.impact,
                fix: patternParsed.fix,
                frequency: 1,
                last_seen: new Date().toISOString(),
              });
            }

            await supabase.from("mirror_memory").insert({
              user_id: userId,
              memory_type: "pattern",
              memory_text: `${patternParsed.pattern_name}: ${patternParsed.pattern_description}`,
            });

            await createNotification(
              supabase, userId,
              "pattern",
              `Pattern detected: ${patternParsed.pattern_name}`,
              patternParsed.pattern_description?.slice(0, 120) ?? "Mirror identified a recurring behavioral pattern."
            );
          }
        }

        // Score shift notification
        if (parsed.scores?.perception) {
          const { data: prevScores } = await supabase
            .from("perception_scores")
            .select("perception_score")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(2);

          if (prevScores && prevScores.length >= 2 && prevScores[1]?.perception_score != null) {
            const delta = parsed.scores.perception - prevScores[1].perception_score;
            if (Math.abs(delta) >= 5) {
              await createNotification(
                supabase, userId,
                "score_shift",
                delta > 0 ? `Perception up ${delta} points.` : `Perception dropped ${Math.abs(delta)} points.`,
                delta > 0
                  ? "Your reads are shifting in the right direction."
                  : "Mirror noticed a dip. Run a scan to understand what shifted."
              );
            }
          }
        }

        // Trigger feed refresh after scan — non-blocking
        supabase.from("mirror_feed").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
          if (!data || Date.now() - new Date(data.created_at).getTime() > 1000 * 60 * 60 * 2) {
            generateFeedItems({ data: {} } as any).catch(() => {});
          }
        });

        // Update streak
        await supabase.rpc("update_user_streak", { p_user_id: userId });
        await checkStreakMilestone(supabase, userId);
      } catch {
        // Background processing failure is non-blocking
      }
    })();

    return result;
  });

// ============================================================
// 4. Ask Mirror — advisor
// ============================================================
export const askMirror = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => z.object({ message: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: history }, { data: recentScans }, { data: patterns }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("advisor_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("scans").select("scan_type, ai_summary").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("patterns").select("pattern_name, pattern_description, frequency").eq("user_id", userId).order("frequency", { ascending: false }).limit(3),
      supabase.from("mirror_memory").select("memory_text, memory_type").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
    ]);

    const scanMemory = (recentScans ?? []).map(s => `- ${s.scan_type}: ${s.ai_summary ?? ""}`).join("\n") || "(none yet)";
    const patternContext = (patterns ?? [])
      .map(p => `- ${p.pattern_name} (seen ${p.frequency}x): ${p.pattern_description}`)
      .join("\n") || "(no patterns detected yet)";
    const memoryContext = (memory ?? [])
      .map(m => `- ${m.memory_text}`)
      .join("\n") || "(no prior observations)";
    const memoryThin = (recentScans?.length ?? 0) < 2;

    const system = `${voiceFor(profile?.tone_preference ?? "Direct")}

User goal: ${profile?.main_goal ?? "—"}
What Mirror has noticed (scans):\n${scanMemory}

Reply in 2 to 5 short, sharp lines. No filler. No disclaimers. No lists.
Anchor every observation in something the user has actually shown Mirror.
End with one clear move.
${memoryThin ? "Mirror has limited context on this user. Keep claims small. If they ask something big, say it is an early read and ask them to share more." : ""}

What Mirror has observed about this user:
Patterns:
${patternContext}

Memory:
${memoryContext}

Use this context to make your responses specific to this user. Reference their actual patterns and observations when relevant. Never be generic. Never give advice that could apply to anyone.`;

    const messages = [
      { role: "system" as const, content: system },
      ...((history ?? []).reverse().map(h => ({ role: h.role as "user" | "assistant", content: h.content }))),
      { role: "user" as const, content: data.message },
    ];
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_completion_tokens: 600, messages }),
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

// ============================================================
// 5. Post Analysis scan
// ============================================================
export const analyzePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { post_text: string; platform?: string; context_note?: string }) =>
    z.object({
      post_text: z.string().min(5).max(3000),
      platform: z.string().optional(),
      context_note: z.string().max(500).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle();

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Analyze this ${data.platform ?? "social media"} post. The user is about to publish it — or already did. Tell them exactly how it lands on the people reading it.

Return STRICT JSON:
{
  "read": "ONE sharp line about the overall signal this post sends. Max 20 words. What do people actually feel when they read this?",
  "what_it_signals": "2-3 lines. What does this post reveal about the person posting it — beyond what they intended? Behavioral read only.",
  "blind_spot": "1-2 lines. What the poster doesn't realize they're showing.",
  "what_is_working": "Optional. Only include if something is genuinely working well — a strong move, a well-landed message, confident energy. If present, 1-2 lines on what landed and why. If nothing stands out as working, omit this field entirely. Do not manufacture positives.",
  "how_it_lands": "one of: 'Strong', 'Neutral', 'Risky', 'Overexposed'",
  "landing_reason": "One line explaining the how_it_lands verdict.",
  "the_move": "One line. Should they post it, edit it, or kill it — and why.",
  "stronger_version": "Optional. If it can be improved, rewrite it in 1-3 sentences in a stronger way. If it's strong as-is, omit this field.",
  "scores": { "perception": 0-100, "confidence": 0-100, "authenticity": 0-100, "authority": 0-100 },
  "summary": "8-10 words for memory"
}

Platform: ${data.platform ?? "not specified"}
Context: ${data.context_note ?? "none"}
IMPORTANT: If the user provided context above, let it meaningfully shape the read. The same words land differently in different relationships, situations, and cultures. A direct message to a close friend reads differently than the same message to a new contact. Weight the context heavily when forming the perception read.
Post:
"""
${data.post_text}
"""`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "post scan" }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "post_analysis",
      input_text: data.post_text.slice(0, 3000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: 50,
        authority_score: parsed.scores.authority ?? 50,
        approachability_score: 50,
        authenticity_score: parsed.scores.authenticity ?? 50,
        emotional_control_score: 50,
        mystery_score: 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    return { scan, result: parsed };
  });

// ============================================================
// 7. Dating Dynamic scan
// ============================================================
export const analyzeDatingDynamic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { situation: string; context_note?: string; dynamic_type?: string }) =>
    z.object({
      situation: z.string().min(10).max(4000),
      context_note: z.string().max(500).optional(),
      dynamic_type: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memoryContext = (memory ?? []).map(m => `- ${m.memory_text}`).join("\n") || "(no prior memory)";

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `You are analyzing a dating or romantic dynamic. The user wants to understand what's actually happening — not what they hope is happening. Read the situation with surgical honesty. No flattery. No false hope. No empty reassurance.

Return STRICT JSON:
{
  "read": "ONE sharp line. The core truth about this dynamic. Max 22 words. Uncomfortable if necessary.",
  "who_has_leverage": "one of: 'You', 'Them', 'Equal', 'Unclear'",
  "leverage_reason": "One line explaining the leverage read.",
  "what_they_likely_feel": "2-3 lines. What the other person is actually feeling — not what they say. Read their behavior, not their words.",
  "what_you_are_doing": "2-3 lines. What the user's behavior is signaling to the other person — without the user realizing it.",
  "blind_spot": "1-2 lines. The thing the user cannot see because they're inside this dynamic.",
  "what_is_working": "Optional. Only include if something is genuinely working well — a strong move, a well-landed message, confident energy. If present, 1-2 lines on what landed and why. If nothing stands out as working, omit this field entirely. Do not manufacture positives.",
  "attraction_read": "one of: 'High', 'Moderate', 'Low', 'Fading', 'Strategic'",
  "attraction_reason": "One line explaining the attraction read.",
  "the_move": "1-2 lines. The single strongest move the user can make right now. Specific. Not 'be yourself' or 'communicate more'.",
  "what_not_to_do": "One line. The move that would cost them the most right now.",
  "scores": { "perception": 0-100, "attraction": 0-100, "confidence": 0-100, "mystery": 0-100 },
  "summary": "8-10 words for memory"
}

What Mirror knows about this user:
${memoryContext}

Dynamic type: ${data.dynamic_type ?? "not specified"}
Context: ${data.context_note ?? "none"}
IMPORTANT: If the user provided context above, let it meaningfully shape the read. The same words land differently in different relationships, situations, and cultures. A direct message to a close friend reads differently than the same message to a new contact. Weight the context heavily when forming the perception read.
Situation:
"""
${data.situation}
"""`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "dating scan" }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "dating_dynamic",
      input_text: data.situation.slice(0, 4000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: parsed.scores.attraction ?? 50,
        authority_score: 50,
        approachability_score: 50,
        authenticity_score: 50,
        emotional_control_score: 50,
        mystery_score: parsed.scores.mystery ?? 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    return { scan, result: parsed };
  });

// ============================================================
// 6. Emotional Pattern scan
// ============================================================
export const analyzeEmotionalPattern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { situation: string; feeling?: string; how_often?: string }) =>
    z.object({
      situation: z.string().min(10).max(3000),
      feeling: z.string().max(200).optional(),
      how_often: z.string().max(100).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memoryContext = (memory ?? []).map(m => `- ${m.memory_text}`).join("\n") || "(no prior memory)";

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `The user is describing an emotional situation or recurring feeling. Your job is not to comfort them. Your job is to identify the behavioral pattern driving it — what they keep doing, what they keep triggering, and what signal they're sending to others without knowing.

Return STRICT JSON:
{
  "read": "ONE sharp line. The core pattern in plain language. Max 20 words. No therapy language.",
  "what_is_actually_happening": "2-3 lines. Not what they feel — what they are doing. Behavioral read only. Anchor in what they described.",
  "the_root": "1-2 lines. The thing beneath the thing. What need or fear is driving this pattern.",
  "how_others_read_it": "1-2 lines. How this pattern lands on the people around them — what they feel or conclude about the user.",
  "blind_spot": "1 line. The one thing the user cannot see from inside this pattern.",
  "what_is_working": "Optional. Only include if something is genuinely working well — a strong move, a well-landed message, confident energy. If present, 1-2 lines on what landed and why. If nothing stands out as working, omit this field entirely. Do not manufacture positives.",
  "the_pattern_name": "3-5 words. A sharp name for this recurring pattern. E.g. 'Approval loop under pressure' or 'Preemptive emotional retreat'.",
  "the_move": "1-2 lines. The single behavioral shift that interrupts this pattern today.",
  "scores": { "perception": 0-100, "emotional_control": 0-100, "authenticity": 0-100, "confidence": 0-100 },
  "summary": "8-10 words for memory"
}

What Mirror has seen before from this user:
${memoryContext}

What the user described:
"""
${data.situation}
"""
Feeling they named: ${data.feeling ?? "not specified"}
How often this happens: ${data.how_often ?? "not specified"}`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "emotional pattern scan" }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "emotional_pattern",
      input_text: data.situation.slice(0, 3000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: 50,
        authority_score: 50,
        approachability_score: 50,
        authenticity_score: parsed.scores.authenticity ?? 50,
        emotional_control_score: parsed.scores.emotional_control ?? 50,
        mystery_score: 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    if (parsed.the_pattern_name && parsed.what_is_actually_happening) {
      const { data: existing } = await supabase
        .from("patterns")
        .select("id, frequency")
        .eq("user_id", userId)
        .eq("pattern_name", parsed.the_pattern_name)
        .maybeSingle();

      if (existing) {
        await supabase.from("patterns").update({
          frequency: (existing.frequency ?? 1) + 1,
          pattern_description: parsed.what_is_actually_happening,
          evidence: parsed.the_root,
          impact: parsed.how_others_read_it,
          fix: parsed.the_move,
          last_seen: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("patterns").insert({
          user_id: userId,
          pattern_name: parsed.the_pattern_name,
          pattern_description: parsed.what_is_actually_happening,
          evidence: parsed.the_root,
          impact: parsed.how_others_read_it,
          fix: parsed.the_move,
          frequency: 1,
          last_seen: new Date().toISOString(),
        });
      }
    }

    return { scan, result: parsed };
  });

// ============================================================
// 8. Decision Perception scan
// ============================================================
export const analyzeDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { decision: string; context_note?: string; decision_type?: string }) =>
    z.object({
      decision: z.string().min(10).max(3000),
      context_note: z.string().max(500).optional(),
      decision_type: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memoryContext = (memory ?? []).map(m => `- ${m.memory_text}`).join("\n") || "(no prior memory)";

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `The user is about to make a decision — or has already made one. Your job is not to validate or judge it. Your job is to read how this decision lands on the people observing it. What signal does it send? What does it reveal about the person making it? How will they be perceived as a result?

Return STRICT JSON:
{
  "read": "ONE sharp line. The core perception signal this decision sends. Max 22 words.",
  "perception_verdict": "one of: 'Strong', 'Calculated', 'Grounded', 'Risky', 'Reactive', 'Weak signal'",
  "verdict_reason": "One line explaining the verdict.",
  "how_it_reads_to_others": "2-3 lines. How the key people in this situation will perceive this decision — not whether it's right, but what it signals about the user.",
  "what_it_reveals": "1-2 lines. What this decision reveals about the user beneath the surface — their fear, their values, or their need.",
  "blind_spot": "1-2 lines. What the user cannot see about how this lands.",
  "what_is_working": "Optional. Only include if something is genuinely working well — a strong move, a well-landed message, confident energy. If present, 1-2 lines on what landed and why. If nothing stands out as working, omit this field entirely. Do not manufacture positives.",
  "the_strongest_version": "1-2 lines. If they're going to make this move, what's the most powerful way to do it — or the framing that makes it land strongest.",
  "alternative_read": "Optional. If there's a significantly stronger alternative decision that would land better, name it in one line. If not, omit.",
  "scores": { "perception": 0-100, "confidence": 0-100, "authority": 0-100, "authenticity": 0-100 },
  "summary": "8-10 words for memory"
}

What Mirror knows about this user:
${memoryContext}

Decision type: ${data.decision_type ?? "not specified"}
Context: ${data.context_note ?? "none"}
IMPORTANT: If the user provided context above, let it meaningfully shape the read. The same words land differently in different relationships, situations, and cultures. A direct message to a close friend reads differently than the same message to a new contact. Weight the context heavily when forming the perception read.
The decision:
"""
${data.decision}
"""`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "decision scan" }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "decision_perception",
      input_text: data.decision.slice(0, 3000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: 50,
        authority_score: parsed.scores.authority ?? 50,
        approachability_score: 50,
        authenticity_score: parsed.scores.authenticity ?? 50,
        emotional_control_score: 50,
        mystery_score: 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    return { scan, result: parsed };
  });

// ============================================================
// 9. Social Profile scan
// ============================================================
export const analyzeSocialProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    bio: string;
    platform?: string;
    username?: string;
    follower_count?: string;
    post_description?: string;
    context_note?: string;
    is_trial?: boolean;
  }) =>
    z.object({
      bio: z.string().min(1).max(2000),
      platform: z.string().optional(),
      username: z.string().max(100).optional(),
      follower_count: z.string().max(50).optional(),
      post_description: z.string().max(1000).optional(),
      context_note: z.string().max(500).optional(),
      is_trial: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memoryContext = (memory ?? []).map(m => `- ${m.memory_text}`).join("\n") || "(no prior memory)";

    const content = await callAI(
      data.is_trial
        ? voiceFor(profile?.tone_preference ?? "Direct") + TRIAL_MODE_ADDENDUM
        : voiceFor(profile?.tone_preference ?? "Direct"),
      `You are reading a social media profile. Your job is to tell the user exactly how their profile lands on a stranger who visits it for the first time — in under 10 seconds. Not what they intended. What is actually felt.

Return STRICT JSON:
{
  "read": "ONE sharp line. The immediate impression a stranger gets. Max 22 words.",
  "first_impression": "2-3 lines. What a stranger feels and concludes in the first 8 seconds of seeing this profile. Specific and behavioral.",
  "what_it_signals": "2-3 lines. What the profile reveals about the person beyond what they intend — status signals, insecurity signals, confidence signals.",
  "blind_spot": "1-2 lines. The thing the profile owner cannot see about how this reads.",
  "what_is_working": "Optional. Only include if something is genuinely working well — a strong move, a well-landed message, confident energy. If present, 1-2 lines on what landed and why. If nothing stands out as working, omit this field entirely. Do not manufacture positives.",
  "profile_verdict": "one of: 'Magnetic', 'Credible', 'Generic', 'Trying too hard', 'Underplaying', 'Confusing'",
  "verdict_reason": "One line explaining the verdict.",
  "strongest_element": "One line. The single strongest thing about this profile.",
  "weakest_element": "One line. The single thing costing them the most.",
  "the_move": "2-3 lines. The specific changes that would make the biggest difference. Not vague advice — exact changes.",
  "scores": { "perception": 0-100, "authority": 0-100, "authenticity": 0-100, "attraction": 0-100 },
  "summary": "8-10 words for memory"
}

What Mirror knows about this user:
${memoryContext}

Platform: ${data.platform ?? "not specified"}
Username: ${data.username ?? "not provided"}
Follower count: ${data.follower_count ?? "not provided"}
Bio:
"""
${data.bio}
"""
What their posts are like: ${data.post_description ?? "not described"}
Context: ${data.context_note ?? "none"}
IMPORTANT: If the user provided context above, let it meaningfully shape the read. The same words land differently in different relationships, situations, and cultures. A direct message to a close friend reads differently than the same message to a new contact. Weight the context heavily when forming the perception read.`,
      true,
      data.is_trial ? 1200 : 800
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "social profile scan" }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "social_profile",
      input_text: data.bio.slice(0, 2000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    // Mark social trial as used
    await supabase
      .from("profiles")
      .update({ trial_social_used: true })
      .eq("user_id", userId);

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: 50,
        attraction_score: parsed.scores.attraction ?? 50,
        authority_score: parsed.scores.authority ?? 50,
        approachability_score: 50,
        authenticity_score: parsed.scores.authenticity ?? 50,
        emotional_control_score: 50,
        mystery_score: 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    return { scan, result: parsed };
  });

// ============================================================
// 10. Selfie & Presence scan
// ============================================================
export const analyzeSelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { image_base64: string; context_note?: string; is_trial?: boolean }) =>
    z.object({
      image_base64: z.string().min(100),
      context_note: z.string().max(500).optional(),
      is_trial: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memoryContext = (memory ?? []).map((m: any) => `- ${m.memory_text}`).join("\n") || "(no prior memory)";
    const system = voiceFor(profile?.tone_preference ?? "Direct");

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: data.is_trial ? 1200 : 800,
        messages: [
          { role: "system", content: data.is_trial ? system + TRIAL_MODE_ADDENDUM : system },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are MIRROR — a high-level perception analyst. Analyze the person's presence from this photo. Read their posture, expression, energy, and confidence signals. Never comment on attractiveness.

CRITICAL: You MUST return ONLY valid JSON. No markdown. No explanation. No preamble. Start your response with { and end with }. If you cannot analyze the image, still return valid JSON with your best observations.

Return this exact JSON structure:
{
  "read": "ONE sharp line. The immediate energy or presence this person projects. Max 22 words. Not about looks — about signal.",
  "presence_read": "2-3 lines. What a stranger would feel and conclude about this person in the first 5 seconds. Behavioral and energetic read only.",
  "confidence_signals": "2-3 lines. What their posture, expression, and energy communicate about their internal state.",
  "blind_spot": "1-2 lines. The signal they're sending without knowing it.",
  "presence_verdict": "one of: 'Commanding', 'Warm', 'Guarded', 'Uncertain', 'Magnetic', 'Closed off', 'Approachable', 'Intense'",
  "verdict_reason": "One line explaining the verdict.",
  "the_move": "1-2 lines. One specific thing they could shift — in how they present themselves — that would change the read.",
  "scores": { "perception": 0-100, "confidence": 0-100, "attraction": 0-100, "approachability": 0-100 },
  "summary": "8-10 words for memory"
}

What Mirror knows about this user:
${memoryContext}

Context from user: ${data.context_note ?? "none"}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${data.image_base64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Mirror is at capacity. Try again in a moment.");
      if (res.status === 402) throw new Error("Mirror credits exhausted.");
      throw new Error(`Vision error: ${res.status} ${text.slice(0, 200)}`);
    }

    const out = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = out.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // If not JSON try to extract meaningful content
      if (cleaned.length > 20 && !cleaned.includes("NOT_A")) {
        parsed = {
          read: cleaned.slice(0, 150),
          presence_read: cleaned.slice(0, 300),
          confidence_signals: "Mirror analyzed your presence from this photo.",
          blind_spot: null,
          presence_verdict: "Observed",
          verdict_reason: null,
          the_move: null,
          scores: { perception: 60, confidence: 60, attraction: 60, approachability: 60 },
          summary: "selfie scan",
        };
      } else {
        parsed = {
          read: "Mirror read your presence. Scroll down for the full analysis.",
          presence_read: cleaned || "Mirror observed your energy and confidence signals from this photo.",
          confidence_signals: "Your physical presence communicates more than you realize.",
          blind_spot: null,
          presence_verdict: "Observed",
          verdict_reason: null,
          the_move: null,
          scores: { perception: 60, confidence: 60, attraction: 60, approachability: 60 },
          summary: "selfie scan",
        };
      }
    }

    // Ensure required fields exist
    if (!parsed.read) parsed.read = cleaned.slice(0, 150) || "Mirror analyzed your presence.";
    if (!parsed.presence_read) parsed.presence_read = cleaned.slice(0, 300);
    if (!parsed.presence_verdict) parsed.presence_verdict = "Observed";

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "selfie_presence",
      input_text: "[image scan]",
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    // Mark selfie trial as used
    await supabase
      .from("profiles")
      .update({ trial_selfie_used: true })
      .eq("user_id", userId);

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: parsed.scores.attraction ?? 50,
        authority_score: 50,
        approachability_score: parsed.scores.approachability ?? 50,
        authenticity_score: 50,
        emotional_control_score: 50,
        mystery_score: 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    return { scan, result: parsed };
  });

// ============================================================
// 11. Voice & Energy scan
// ============================================================
export const analyzeVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    transcript: string;
    vocal_description?: string;
    context_note?: string;
    is_trial?: boolean;
  }) =>
    z.object({
      transcript: z.string().min(10).max(5000),
      vocal_description: z.string().max(500).optional(),
      context_note: z.string().max(500).optional(),
      is_trial: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("tone_preference, main_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const memoryContext = (memory ?? []).map((m: any) => `- ${m.memory_text}`).join("\n") || "(no prior memory)";

    const content = await callAI(
      data.is_trial
        ? voiceFor(profile?.tone_preference ?? "Direct") + TRIAL_MODE_ADDENDUM
        : voiceFor(profile?.tone_preference ?? "Direct"),
      `You are analyzing someone's voice note transcript and how they sound. Read the energy, confidence, and behavioral signals in how they speak — not just what they say. Look for: trailing sentences, over-explanation, filler words, hedging language, apology patterns, certainty signals, authority signals, and emotional tone.

Return STRICT JSON:
{
  "read": "ONE sharp line. The core energy signal this person projects when they speak. Max 22 words.",
  "energy_read": "2-3 lines. How this person sounds to someone hearing them for the first time. What they feel about the speaker based on delivery.",
  "vocal_patterns": "2-3 lines. The specific speech patterns that define how this person communicates — what they do repeatedly without noticing.",
  "blind_spot": "1-2 lines. The signal their voice is sending that they're not aware of.",
  "energy_verdict": "one of: 'Commanding', 'Warm', 'Anxious', 'Confident', 'Hesitant', 'Overexplaining', 'Grounded', 'Scattered'",
  "verdict_reason": "One line explaining the verdict.",
  "confidence_read": "one of: 'High', 'Moderate', 'Low', 'Performed'",
  "the_move": "1-2 lines. The single shift in how they speak that would change how they're received most.",
  "scores": { "perception": 0-100, "confidence": 0-100, "authority": 0-100, "authenticity": 0-100 },
  "summary": "8-10 words for memory"
}

What Mirror knows about this user:
${memoryContext}

Vocal qualities the user described: ${data.vocal_description ?? "not described"}
Context: ${data.context_note ?? "none"}

Transcript:
"""
${data.transcript}
"""`,
      true,
      data.is_trial ? 1200 : 800
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { read: content.slice(0, 200), summary: "voice scan" }; }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "voice_energy",
      input_text: data.transcript.slice(0, 5000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: parsed.scores ?? null,
    }).select().single();

    // Mark voice trial as used
    await supabase
      .from("profiles")
      .update({ trial_voice_used: true })
      .eq("user_id", userId);

    if (parsed.scores) {
      await supabase.from("perception_scores").insert({
        user_id: userId,
        perception_score: parsed.scores.perception ?? 50,
        confidence_score: parsed.scores.confidence ?? 50,
        attraction_score: 50,
        authority_score: parsed.scores.authority ?? 50,
        approachability_score: 50,
        authenticity_score: parsed.scores.authenticity ?? 50,
        emotional_control_score: 50,
        mystery_score: 50,
        mirror_score: computeMirrorScore(parsed.scores),
      });
    }

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "scan_insight",
        memory_text: parsed.blind_spot,
      });
    }

    return { scan, result: parsed };
  });

// ============================================================
// 12. Weekly Blind Spot Report
// ============================================================
export const generateWeeklyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const { data: existing } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart.toISOString().slice(0, 10))
      .maybeSingle();

    if (existing) return existing;

    const [
      { data: profile },
      { data: weekScans },
      { data: allPatterns },
      { data: recentScores },
      { data: memory },
      { data: dailyReads },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("scans")
        .select("scan_type, ai_summary, result_json, created_at")
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("patterns")
        .select("pattern_name, pattern_description, frequency, evidence, impact, fix")
        .eq("user_id", userId)
        .order("frequency", { ascending: false })
        .limit(5),
      supabase.from("perception_scores")
        .select("perception_score, confidence_score, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("mirror_memory")
        .select("memory_type, memory_text")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("daily_reads")
        .select("read, mission, date")
        .eq("user_id", userId)
        .gte("date", weekStart.toISOString().slice(0, 10))
        .order("date", { ascending: false }),
    ]);

    const scanSummaries = (weekScans ?? []).map((s: any) =>
      `- [${s.scan_type}] ${s.ai_summary ?? ""}`
    ).join("\n") || "(no scans this week)";

    const patternLines = (allPatterns ?? []).map((p: any) =>
      `- ${p.pattern_name} (seen ${p.frequency}x): ${p.pattern_description}`
    ).join("\n") || "(no patterns yet)";

    const memoryLines = (memory ?? []).map((m: any) =>
      `- ${m.memory_type}: ${m.memory_text}`
    ).join("\n") || "(no memory)";

    const dailyLines = (dailyReads ?? []).map((r: any) =>
      `- ${r.date}: ${r.read}`
    ).join("\n") || "(no daily reads this week)";

    const scores = recentScores ?? [];
    const scoreDelta = scores.length >= 2
      ? (scores[0].perception_score ?? 0) - (scores[scores.length - 1].perception_score ?? 0)
      : 0;

    const isEarlyUser = (weekScans?.length ?? 0) < 2;

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Generate this user's Weekly Blind Spot Report. This is not a summary. This is Mirror's most important read of the week — the pattern that defined it, the blind spot that kept appearing, how their perception shifted, and the single most important move for next week.

${isEarlyUser ? "Mirror has limited data this week. Keep claims small. Frame as an early read. Do not invent patterns." : ""}

Return STRICT JSON:
{
  "dominant_pattern": "The single most important pattern Mirror observed this week. 1-2 lines. Specific and behavioral — not generic.",
  "blind_spot": "The recurring thing they cannot see about themselves this week. 1-2 lines. The thing that kept showing up across multiple scans or situations.",
  "perception_shift": "How their perception score moved this week and what drove it. 1-2 lines. Reference specific behavior if possible.",
  "the_week_read": "ONE sharp line summarizing what defined this week for them perceptually. This is the line they'd screenshot.",
  "full_report": "4-6 paragraphs. The complete weekly read. Each paragraph is 2-4 sentences. Grounded in what Mirror actually observed this week — scans, patterns, daily reads. Not generic. Not encouraging. Just what Mirror saw. End with the single most important move for next week.",
  "next_move": "One specific, concrete action for next week. Not a mindset shift — a behavior change.",
  "score_delta": ${scoreDelta}
}

User goal: ${profile?.main_goal ?? "—"}
This week's scans:
${scanSummaries}

Recurring patterns Mirror has detected:
${patternLines}

What Mirror remembers:
${memoryLines}

This week's daily reads:
${dailyLines}

Perception score change this week: ${scoreDelta > 0 ? "+" : ""}${scoreDelta} points`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      parsed = {
        dominant_pattern: "",
        blind_spot: "",
        perception_shift: "",
        the_week_read: content.slice(0, 140),
        full_report: content,
        next_move: "",
        score_delta: scoreDelta,
      };
    }

    const { data: report } = await supabase.from("weekly_reports").insert({
      user_id: userId,
      week_start: weekStart.toISOString().slice(0, 10),
      week_end: weekEnd.toISOString().slice(0, 10),
      dominant_pattern: parsed.dominant_pattern ?? "",
      blind_spot: parsed.blind_spot ?? "",
      perception_shift: parsed.perception_shift ?? "",
      full_report: parsed.full_report ?? "",
      score_delta: parsed.score_delta ?? 0,
    }).select().single();

    await createNotification(
      supabase, userId,
      "weekly_report",
      "Your weekly report is ready.",
      parsed.the_week_read?.slice(0, 120) ?? "Mirror has compiled your week."
    );

    if (parsed.blind_spot) {
      await supabase.from("mirror_memory").insert({
        user_id: userId,
        memory_type: "weekly_blind_spot",
        memory_text: parsed.blind_spot,
      });
    }

    return { ...report, the_week_read: parsed.the_week_read, next_move: parsed.next_move };
  });

// ============================================================
// 13. Mirror Feed Generator
// ============================================================
export const generateFeedItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: lastFeed } = await supabase
      .from("mirror_feed")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastFeed) {
      const diff = Date.now() - new Date(lastFeed.created_at).getTime();
      if (diff < 1000 * 60 * 60 * 2) return { generated: false };
    }

    const [{ data: profile }, { data: scans }, { data: patterns }, { data: scores }, { data: memory }] = await Promise.all([
      supabase.from("profiles").select("name, main_goal, tone_preference").eq("user_id", userId).maybeSingle(),
      supabase.from("scans").select("scan_type, ai_summary, result_json, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("patterns").select("pattern_name, pattern_description, frequency").eq("user_id", userId).order("frequency", { ascending: false }).limit(3),
      supabase.from("perception_scores").select("mirror_score, confidence_score, perception_score").eq("user_id", userId).order("created_at", { ascending: false }).limit(3),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const scanLines = (scans ?? []).map((s: any) => `- [${s.scan_type}] ${s.ai_summary ?? ""}`).join("\n") || "(no scans yet)";
    const patternLines = (patterns ?? []).map((p: any) => `- ${p.pattern_name}: ${p.pattern_description}`).join("\n") || "(none)";
    const memoryLines = (memory ?? []).map((m: any) => `- ${m.memory_text}`).join("\n") || "(none)";
    const latestScore = scores?.[0]?.mirror_score ?? 0;
    const prevScore = scores?.[1]?.mirror_score ?? latestScore;
    const scoreDelta = latestScore - prevScore;

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Generate 4 short Mirror Feed items for this user. These are micro-observations that appear in a social-media-style feed. Each one should feel like Mirror has been quietly watching and just noticed something worth saying. They must be specific to this user's data — never generic.

Feed item types:
- "observation" — a short sharp behavioral observation based on scan history
- "pattern_update" — something new Mirror noticed about a recurring pattern  
- "score_signal" — a read on what a score shift means behaviorally
- "blind_spot_flash" — a quick one-liner about something the user keeps missing
- "strength_signal" — something that is genuinely working — confirm it specifically

Rules:
- Each headline is ONE sharp line. Max 15 words. Must stop a scroll.
- Each body is 1-2 sentences MAX. Behavioral language. Specific. Never generic.
- Vary the types — no two consecutive items of the same type
- At least one must be positive/confirming if the data supports it
- Must feel like they were written about THIS specific user, not anyone

Return STRICT JSON:
{
  "items": [
    {
      "type": "observation",
      "headline": "sharp one-liner",
      "body": "1-2 sentences of specific behavioral read"
    }
  ]
}

User data:
Name: ${profile?.name ?? "—"}
Goal: ${profile?.main_goal ?? "—"}
Mirror Score: ${latestScore} (${scoreDelta >= 0 ? "+" : ""}${scoreDelta} recent shift)
Recent scans:
${scanLines}
Patterns Mirror detected:
${patternLines}
What Mirror remembers:
${memoryLines}`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { return { generated: false }; }

    const items = parsed?.items ?? [];
    if (!items.length) return { generated: false };

    await supabase.from("mirror_feed").insert(
      items.map((item: any) => ({
        user_id: userId,
        type: item.type,
        headline: item.headline,
        body: item.body,
      }))
    );

    return { generated: true, count: items.length };
  });

// ============================================================
// 14. Mirror for Someone Else
// ============================================================
export const analyzeOtherPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    input_text: string;
    person_description?: string;
    relationship?: string;
    context_note?: string;
  }) =>
    z.object({
      input_text: z.string().min(10).max(4000),
      person_description: z.string().max(500).optional(),
      relationship: z.string().max(100).optional(),
      context_note: z.string().max(500).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("tone_preference")
      .eq("user_id", userId)
      .maybeSingle();

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `You are reading ANOTHER person — not the user asking. The user has shared a conversation, description, or situation involving someone else. Your job is to read that other person's behavior, patterns, emotional state, and how they actually come across. Be surgical, specific, and honest. Never comfort the user asking. Read the other person.

Return STRICT JSON:
{
  "read": "ONE sharp line about this person. Max 20 words. What is the dominant signal they are sending?",
  "what_they_actually_feel": "2-3 lines. What this person is genuinely feeling beneath what they are saying or showing. Behavioral read only — anchor in what was provided.",
  "their_dominant_pattern": "1-2 lines. The behavioral pattern this person operates from most consistently.",
  "what_they_want": "1-2 lines. What this person actually wants from this situation or relationship — not what they say they want.",
  "their_blind_spot": "1-2 lines. The thing this person cannot see about how they are coming across.",
  "are_they_being_honest": "one of: 'Yes', 'Mostly', 'Selectively', 'No', 'Unclear'",
  "honesty_reason": "One line explaining the honesty read.",
  "how_they_see_the_user": "1-2 lines. How this person likely perceives the user asking — what role does the user play in this person's mind.",
  "the_move": "1-2 lines. Given all of this — what is the single strongest move the user can make right now with this person.",
  "risk_flag": "Optional. Only if there is a serious red flag in how this person is operating — name it in one line. If nothing alarming, omit.",
  "summary": "8-10 words for memory"
}

Who this person is: ${data.person_description ?? "not described"}
Relationship to the user: ${data.relationship ?? "not specified"}
Context: ${data.context_note ?? "none"}
What the user shared:
"""
${data.input_text}
"""`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      parsed = { read: content.slice(0, 200), summary: "other person scan" };
    }

    const { data: scan } = await supabase.from("scans").insert({
      user_id: userId,
      scan_type: "other_person",
      input_text: data.input_text.slice(0, 4000),
      ai_summary: parsed.summary ?? parsed.read ?? null,
      result_json: parsed,
      score_json: null,
    }).select().single();

    return { scan, result: parsed };
  });

// ============================================================
// 15. Mirror Dossier Generator
// ============================================================
export const generateDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("dossier")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const diff = Date.now() - new Date(existing.generated_at).getTime();
      if (diff < 1000 * 60 * 60 * 24 * 7) return existing;
    }

    const [
      { data: profile },
      { data: scans },
      { data: patterns },
      { data: scores },
      { data: memory },
      { data: weeklyReports },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("scans").select("scan_type, ai_summary, result_json, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("patterns").select("*").eq("user_id", userId).order("frequency", { ascending: false }),
      supabase.from("perception_scores").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("mirror_memory").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("weekly_reports").select("dominant_pattern, blind_spot, full_report").eq("user_id", userId).order("created_at", { ascending: false }).limit(4),
    ]);

    const scanCount = scans?.length ?? 0;
    const latestScore: any = scores?.[0];
    const mirrorScore = latestScore?.mirror_score ?? 0;
    const classLevel = mirrorScore >= 700 ? "ELITE CLEARANCE" :
      mirrorScore >= 500 ? "ENHANCED ACCESS" :
      scanCount >= 5 ? "STANDARD ACCESS" : "BASIC ACCESS";

    const scanLines = (scans ?? []).map((s: any) => `[${s.scan_type}] ${s.ai_summary ?? ""}`).join("\n");
    const patternLines = (patterns ?? []).map((p: any) => `${p.pattern_name} (${p.frequency}x): ${p.pattern_description}`).join("\n");
    const memoryLines = (memory ?? []).map((m: any) => m.memory_text).join("\n");
    const weeklyLines = (weeklyReports ?? []).map((w: any) => w.dominant_pattern ?? "").join("\n");

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Generate a classified Mirror Dossier — a comprehensive behavioral intelligence profile on this user. This is the most complete read Mirror has ever delivered on them. It is built from everything Mirror has observed. It should feel like a classified intelligence brief — specific, surgical, uncomfortably accurate.

This is NOT a report. It is a DOSSIER. The language should feel like something the user was never supposed to see about themselves.

Return STRICT JSON:
{
  "core_signal": "The single most defining thing about how this person comes across. 1-2 sentences. The one thing Mirror keeps seeing no matter what situation they're in.",
  "dominant_pattern": "The behavioral pattern that shows up most consistently across all their scans. Name it precisely. 2-3 sentences.",
  "recurring_blind_spot": "The thing this person cannot see about themselves that keeps costing them. Specific. 1-2 sentences.",
  "perception_trajectory": "How their perception has shifted over the time Mirror has been watching. Are they improving? Regressing? Plateauing? 1-2 sentences.",
  "social_archetype": "One of: The Performer, The Controller, The Withdrawer, The Seeker, The Challenger, The Protector, The Mirror, The Ghost, The Architect, The Empath. Pick the one that fits most precisely.",
  "archetype_description": "2-3 lines explaining exactly why Mirror assigned this archetype — grounded in specific behavioral evidence.",
  "relationship_pattern": "How this person shows up in relationships — romantic, professional, social. What do they do consistently that shapes every connection. 2-3 sentences.",
  "strength_profile": "What this person genuinely does well perceptually. Not manufactured positivity — real strengths Mirror has observed. 2-3 sentences.",
  "risk_profile": "The behavioral risks that could cost this person significantly if unchecked. 1-2 sentences. Calm and specific.",
  "full_assessment": "4-6 paragraphs. The complete Mirror assessment. Written like a classified intelligence brief. Covers: how they operate, what drives them, what they project vs what they feel, where they are right now, and what Mirror predicts if current patterns continue. End with one precise move that would change the trajectory."
}

User data:
Name: ${profile?.name ?? "—"}
Goal: ${profile?.main_goal ?? "—"}
Mirror Score: ${mirrorScore}
Total scans: ${scanCount}
Current streak: ${(profile as any)?.current_streak ?? 0} days

Recent scans:
${scanLines}

Detected patterns:
${patternLines}

Mirror Memory:
${memoryLines}

Weekly report patterns:
${weeklyLines}

Score trajectory: Perception ${latestScore?.perception_score ?? 50}, Confidence ${latestScore?.confidence_score ?? 50}, Attraction ${latestScore?.attraction_score ?? 50}, Authority ${latestScore?.authority_score ?? 50}`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      return existing ?? null;
    }

    const dossierData = {
      user_id: userId,
      core_signal: parsed.core_signal,
      dominant_pattern: parsed.dominant_pattern,
      recurring_blind_spot: parsed.recurring_blind_spot,
      perception_trajectory: parsed.perception_trajectory,
      social_archetype: parsed.social_archetype,
      archetype_description: parsed.archetype_description,
      relationship_pattern: parsed.relationship_pattern,
      strength_profile: parsed.strength_profile,
      risk_profile: parsed.risk_profile,
      full_assessment: parsed.full_assessment,
      classification_level: classLevel,
      generated_at: new Date().toISOString(),
    };

    await supabase.from("dossier").upsert(dossierData, { onConflict: "user_id" });

    await createNotification(
      supabase, userId,
      "milestone",
      "Your Mirror Dossier is ready.",
      "Mirror has compiled a complete behavioral intelligence profile on you."
    );

    return dossierData;
  });

// ============================================================
// 16. Mirror Predictions
// ============================================================
export const generatePredictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    if ((count ?? 0) < 3) return { predictions: [], insufficient_data: true };

    const { data: lastPred } = await supabase
      .from("predictions")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastPred) {
      const diff = Date.now() - new Date(lastPred.created_at).getTime();
      if (diff < 1000 * 60 * 60 * 24 * 7) {
        const { data: existing } = await supabase
          .from("predictions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        return { predictions: existing ?? [], insufficient_data: false };
      }
    }

    const [{ data: profile }, { data: patterns }, { data: memory }, { data: scores }, { data: scans }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("patterns").select("*").eq("user_id", userId).order("frequency", { ascending: false }).limit(5),
      supabase.from("mirror_memory").select("memory_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("perception_scores").select("mirror_score, confidence_score, perception_score").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("scans").select("scan_type, ai_summary").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);

    const patternLines = (patterns ?? []).map((p: any) => `${p.pattern_name} (${p.frequency}x): ${p.pattern_description}`).join("\n");
    const memoryLines = (memory ?? []).map((m: any) => m.memory_text).join("\n");
    const scanLines = (scans ?? []).map((s: any) => `[${s.scan_type}] ${s.ai_summary}`).join("\n");
    const scoreTrajectory = (scores ?? []).map((s: any) => s.mirror_score).join(" → ");

    const content = await callAI(
      voiceFor(profile?.tone_preference ?? "Direct"),
      `Based on this user's behavioral patterns, generate 3 specific predictions about what will happen in their near future if current patterns continue unchanged. These must be grounded in observable behavioral evidence — not guesses. Specific, calibrated, uncomfortable because they are likely true.

Return STRICT JSON:
{
  "predictions": [
    {
      "prediction": "What Mirror predicts will happen. One sharp specific sentence. Max 20 words.",
      "reasoning": "2-3 lines explaining exactly why Mirror is predicting this — grounded in specific patterns observed.",
      "category": "one of: dating, social, career, communication, self-perception",
      "timeframe": "one of: This week, Within 2 weeks, Within a month, Within 3 months"
    }
  ]
}

Rules:
- Each prediction must be anchored in a specific observed pattern
- At least one prediction should be positive — something good that will happen if they stay consistent
- At least one should be a warning — something that will cost them if they don't shift
- Timeframes must be realistic — do not predict things years away
- Never predict health, financial, or safety outcomes
- Never be vague — "you will struggle with communication" is not a prediction. "The next time you're in a high-stakes conversation you will over-explain and lose leverage" is.

User patterns:
${patternLines}

Mirror memory:
${memoryLines}

Recent scans:
${scanLines}

Score trajectory: ${scoreTrajectory}
Goal: ${profile?.main_goal ?? "—"}`
    );

    let parsed: any;
    try { parsed = JSON.parse(content); } catch { return { predictions: [], insufficient_data: false }; }

    const items = parsed?.predictions ?? [];
    if (!items.length) return { predictions: [], insufficient_data: false };

    const inserted = await supabase
      .from("predictions")
      .insert(items.map((p: any) => ({
        user_id: userId,
        prediction: p.prediction,
        reasoning: p.reasoning,
        category: p.category,
        timeframe: p.timeframe,
      })))
      .select();

    await createNotification(
      supabase, userId,
      "milestone",
      "Mirror made 3 predictions about you.",
      "Based on your patterns — open Mirror to see what's coming."
    );

    return { predictions: inserted.data ?? [], insufficient_data: false };
  });

export const verifyPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prediction_id: string; outcome: string; outcome_note?: string }) =>
    z.object({
      prediction_id: z.string(),
      outcome: z.enum(["correct", "incorrect", "partially"]),
      outcome_note: z.string().max(500).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase
      .from("predictions")
      .update({
        outcome: data.outcome,
        outcome_note: data.outcome_note,
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.prediction_id);
    return { success: true };
  });

