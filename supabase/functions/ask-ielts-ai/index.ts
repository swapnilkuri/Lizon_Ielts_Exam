// Supabase Edge Function: ask-ielts-ai
// Keeps the Gemini API key on the server so it is never exposed in the browser.
//
// Deploy:
//   supabase secrets set GEMINI_API_KEY=your_new_key_here
//   supabase functions deploy ask-ielts-ai
//
// Optional: supabase secrets set GEMINI_MODEL=gemini-2.5-flash

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const MAX_MESSAGES = 12;        // how much history we accept per request
const MAX_CHARS = 2000;         // per message
const RATE_LIMIT = 20;          // requests
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes, per IP (best effort)

const SYSTEM_PROMPT = `You are "Cambridge IELTS Expert AI", the study assistant of LizOn Education, an IELTS and PTE coaching center in Dhaka, Bangladesh.

Your job: help students prepare for the IELTS exam (Academic and General Training) - Listening, Reading, Writing Task 1 and 2, Speaking Parts 1-3, band descriptors, vocabulary, grammar, time management, exam-day rules, and study plans.

How to answer:
- Be accurate, practical and band-focused. Give concrete steps, examples and model sentences, not vague advice.
- When a student pastes a writing answer, assess it against the four criteria (Task Achievement/Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy), estimate a band range, list the top fixes, and show improved versions of weak sentences. Say clearly that your band is an estimate.
- For Speaking, give sample answers at the level requested and explain why they score well.
- Keep answers concise: short paragraphs, bullet points, and small tables only when they help. Use simple English; if the student writes in Bangla, reply in Bangla mixed with the English IELTS terms.
- If you are unsure about a fact (test fees, dates, policies, country-specific rules), say so and point the student to the official IELTS / British Council / IDP website instead of guessing.
- Never claim to be an official examiner or to guarantee a band score.
- If asked about something unrelated to IELTS, English learning, or study abroad preparation, politely steer back to IELTS.
- For personal feedback, mock tests, courses or 1v1 mentorship, you may mention LizOn Education's WhatsApp helpline: 01611611139. Only do this when it is genuinely useful, not in every reply.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Best-effort in-memory rate limiter (resets when the function instance recycles).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return json({ error: "The AI service is not configured yet." }, 500);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return json({ error: "You are sending messages too quickly. Please wait a few minutes." }, 429);
  }

  let payload: { messages?: { role: string; content: string }[] };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const incoming = Array.isArray(payload.messages) ? payload.messages : [];
  const cleaned = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_MESSAGES);

  // Gemini needs the conversation to start with a user turn and end with one.
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return json({ error: "Please send a question." }, 400);
  }

  const contents = cleaned.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1500,
            thinkingConfig: { thinkingBudget: 0 }, // faster replies for chat
          },
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini error:", res.status, JSON.stringify(data));
      if (res.status === 429) {
        return json({ error: "The AI is busy right now. Please try again in a minute." }, 429);
      }
      return json({ error: "The AI could not answer right now. Please try again." }, 502);
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      const blocked = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason;
      console.warn("Empty reply:", blocked);
      return json({ reply: "I couldn't produce an answer for that. Could you rephrase your IELTS question?" });
    }

    return json({ reply });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
