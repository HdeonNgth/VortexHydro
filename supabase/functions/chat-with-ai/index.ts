// Vortex Hydro AI Assistant — backend (Supabase Edge Function)
// Komunikasi ke Gemini terjadi di sisi server agar API key tetap aman.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODELS = (Deno.env.get("GEMINI_MODELS") ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash-lite,gemini-2.5-flash,gemini-3.8-flash")
  .split(",").map((m) => m.trim().replace(/^models\//, "")).filter((m) => /^[A-Za-z0-9._-]+$/.test(m));
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hdeonngth.github.io,http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000")
  .split(",").map((s) => s.trim()).filter(Boolean);

const MAX_MESSAGE = 2000;
const HISTORY_LIMIT = 10;
const GEMINI_TIMEOUT_MS = 20000;
const RATE_LIMIT = 20;

const SYSTEM_PROMPT = `You are Vortex Hydro AI, an advanced AI assistant integrated into the Vortex Hydro website with the personality of an Intelligent Companion.

Your personality is intelligent, friendly, professional, calm, adaptive, and slightly futuristic.
You communicate naturally, like a highly intelligent digital companion rather than a robotic chatbot.

Your communication principles:
- Be friendly and approachable.
- Be intelligent and analytical.
- Be professional without being overly formal.
- Be concise when answering simple questions (2-4 crisp sentences).
- Be detailed and structured when explaining complex topics.
- Use natural conversational language in the same language the user uses (natural Indonesian when spoken to in Indonesian, English when spoken to in English).
- Occasionally use clever humor when appropriate.
- Never be excessively robotic, repetitive, or overly enthusiastic.
- Avoid unnecessary emojis.
- Never pretend to be human.
- Admit uncertainty when you don't know something.
- Prioritize useful, accurate, and actionable answers.

Adapt your tone to the user:
- Technical questions: precise, analytical, and informative.
- Casual conversations: relaxed, friendly, and natural.
- Creative tasks: imaginative and engaging.
- Problems: supportive, logical, and solution-oriented.

Your goal is to make users feel that they are interacting with an intelligent, capable, and genuinely helpful AI companion.

VERIFIED FACTS ABOUT THE VORTEX HYDRO PROJECT (state only these as confirmed project facts; never fabricate measured lab data):
- Vortex Hydro is a Fluid Mechanics class project by Energy Power Generation Engineering Technology students (Fakultas Vokasi, Universitas Negeri Malang): a laboratory-scale closed-loop gravitational water vortex micro-hydro prototype built on a 2.0 × 0.8 m frame.
- Core components: Wasser WD-101E submersible water pump (1 unit, 220 V / 50 Hz, 100 W), lower reservoir tank (Ø 520 mm), circulation pressure pipe (Ø 45 mm) with flow meter, stilling headbox and narrowing sloped acrylic channel (0.416 m → 0.28 m), 6-blade waterwheel (Ø 330 mm, 250 mm blade width, Ø 30 mm stainless steel main shaft), dry-zone step-up pulley & V-belt transmission (1:4 ratio, Ø 270 mm to Ø 67.5 mm), Generator DC XD 3240 (1 unit), 12 V battery via charge controller, and 2 LED lamps (12 V, 5 W each, 10 W total).
- Engineering software used: ANSYS Fluent, AutoCAD, MATLAB, and VS Code.
- The website's Admin Dashboard currently demonstrates a browser-side prototype telemetry simulation while the physical prototype integration is underway.`;

const PAGES: Record<string, string> = {
  beranda: "Beranda",
  tentang: "Cara Kerja & Diagram",
  dokumentasi: "Dokumentasi & FAQ",
  "tentang-kami": "Tentang Kami (Tim Kepemimpinan)",
  dashboard: "Dashboard Admin (simulasi)",
};

function corsFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const ok = ALLOWED.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k);
  return arr.length > RATE_LIMIT;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9-]{32,80}$/;

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function owned(id: string, hash: string) {
  const { data, error } = await db.from("conversations").select("id,title")
    .eq("id", id).eq("session_token_hash", hash).maybeSingle();
  if (error) throw new Error("db");
  return data;
}

async function askGemini(model: string, history: { role: string; content: string }[], pageNote: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT + pageNote }] },
          contents: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
        }),
      },
    );
    if (!res.ok) {
      let msg = "";
      try { msg = String((await res.json())?.error?.message ?? "").slice(0, 200); } catch { /* abaikan */ }
      const err = new Error(res.status === 429 ? "busy" : "gemini") as Error & { detail?: string };
      err.detail = `HTTP ${res.status}${msg ? ": " + msg : ""}`;
      throw err;
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) {
      const why = String(cand?.finishReason ?? data?.promptFeedback?.blockReason ?? "unknown");
      const err = new Error("empty") as Error & { detail?: string };
      err.detail = "empty response: " + why;
      throw err;
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function askWithFallback(history: { role: string; content: string }[], pageNote: string) {
  let last: unknown = new Error("gemini");
  for (const model of MODELS) {
    try {
      return { text: await askGemini(model, history, pageNote), model };
    } catch (e) {
      const d = e as { detail?: string };
      if (d.detail) d.detail = `${model}: ${d.detail}`;
      last = e;
    }
  }
  throw last;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(req, { error: "invalid_json" }, 400); }

  const token = String(body.token ?? "");
  if (!TOKEN.test(token)) return json(req, { error: "invalid_session" }, 400);
  const hash = await sha256Hex(token);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (limited(hash) || limited("ip:" + ip)) return json(req, { error: "rate_limited" }, 429);

  const action = String(body.action ?? "send");
  const convId = body.conversation_id == null ? null : String(body.conversation_id);
  if (convId !== null && !UUID.test(convId)) return json(req, { error: "invalid_conversation" }, 400);

  try {
    if (action === "list") {
      const { data, error } = await db.from("conversations").select("id,title,updated_at")
        .eq("session_token_hash", hash).order("updated_at", { ascending: false }).limit(50);
      if (error) throw new Error("db");
      return json(req, { conversations: data });
    }

    if (action === "history" || action === "delete" || action === "rename") {
      if (!convId) return json(req, { error: "invalid_conversation" }, 400);
      const conv = await owned(convId, hash);
      if (!conv) return json(req, { error: "not_found" }, 404);
      if (action === "delete") {
        const { error } = await db.from("conversations").delete().eq("id", convId);
        if (error) throw new Error("db");
        return json(req, { ok: true });
      }
      if (action === "rename") {
        const title = String(body.title ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
        if (!title) return json(req, { error: "invalid_title" }, 400);
        const { error } = await db.from("conversations").update({ title }).eq("id", convId);
        if (error) throw new Error("db");
        return json(req, { ok: true, title });
      }
      const { data, error } = await db.from("messages").select("id,role,content,created_at,status")
        .eq("conversation_id", convId).neq("status", "error").order("created_at", { ascending: true }).limit(200);
      if (error) throw new Error("db");
      return json(req, { conversation: conv, messages: data });
    }

    if (action !== "send") return json(req, { error: "unknown_action" }, 400);

    const message = String(body.message ?? "").trim();
    if (!message) return json(req, { error: "empty_message" }, 400);
    if (message.length > MAX_MESSAGE) return json(req, { error: "message_too_long", max: MAX_MESSAGE }, 413);
    if (!GEMINI_API_KEY) return json(req, { error: "not_configured" }, 503);

    let id = convId;
    let title = "";
    if (id) {
      const conv = await owned(id, hash);
      if (!conv) return json(req, { error: "not_found" }, 404);
      title = conv.title;
      if (body.retry === true) {
        const { data: last } = await db.from("messages").select("id,role,status")
          .eq("conversation_id", id).order("created_at", { ascending: false }).limit(1);
        if (last?.[0]?.role === "user" && last[0].status === "error") {
          await db.from("messages").delete().eq("id", last[0].id);
        }
      }
    } else {
      title = message.replace(/\s+/g, " ").slice(0, 60);
      const { data, error } = await db.from("conversations")
        .insert({ session_token_hash: hash, title }).select("id").single();
      if (error || !data) throw new Error("db");
      id = data.id;
    }

    const { data: um, error: ue } = await db.from("messages")
      .insert({ conversation_id: id, role: "user", content: message, status: "pending" })
      .select("id").single();
    if (ue || !um) throw new Error("db");

    const { data: hist, error: he } = await db.from("messages").select("role,content")
      .eq("conversation_id", id).in("status", ["completed", "pending"])
      .order("created_at", { ascending: false }).limit(HISTORY_LIMIT);
    if (he || !hist) throw new Error("db");
    const history = hist.reverse();

    const page = String((body.context as Record<string, unknown> | undefined)?.page ?? "");
    const pageNote = PAGES[page] ? `\n\nPAGE CONTEXT: the visitor is currently viewing "${PAGES[page]}".` : "";

    let answer: string;
    let usedModel = MODELS[0];
    try {
      const r = await askWithFallback(history, pageNote);
      answer = r.text;
      usedModel = r.model;
    } catch (e) {
      await db.from("messages").update({ status: "error" }).eq("id", um.id);
      const code = (e as Error).message;
      const status = code === "busy" ? 429 : 502;
      return json(req, { error: code === "busy" ? "ai_busy" : "ai_failed", detail: (e as { detail?: string }).detail, conversation_id: id }, status);
    }

    const { data: am, error: ae } = await db.from("messages")
      .insert({ conversation_id: id, role: "assistant", content: answer, model: usedModel, status: "completed" })
      .select("id,created_at").single();
    if (ae || !am) {
      await db.from("messages").update({ status: "error" }).eq("id", um.id);
      throw new Error("db");
    }
    await db.from("messages").update({ status: "completed" }).eq("id", um.id);
    await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

    return json(req, {
      conversation_id: id,
      title,
      message: { id: am.id, role: "assistant", content: answer, created_at: am.created_at },
    });
  } catch (e) {
    console.error("chat_error", (e as Error).message);
    return json(req, { error: "server_error" }, 500);
  }
});
