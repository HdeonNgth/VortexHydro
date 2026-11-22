// Vortex Hydro Public Private Anonymous AI Assistant — Backend (Supabase Edge Function)
// No login required for visitors. Strict server-issued HMAC-signed session tokens + SHA-256 DB lookup.
// Gemini API key stays strictly server-side in Supabase Secrets.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGNING_SECRET = Deno.env.get("SESSION_SIGNING_SECRET") ?? SERVICE_KEY;
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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SYSTEM_PROMPT = `You are Voxxy, the friendly, fresh, and intelligent AI companion integrated into the Vortex Hydro website.

Your personality is intelligent, friendly, expressive, warm, playful-yet-professional, adaptive, and slightly futuristic.
You communicate naturally, like a lively and approachable digital companion (named Voxxy) rather than a robotic chatbot.

Your communication principles:
- Be friendly, approachable, and genuinely expressive.
- Be intelligent and analytical.
- Be professional without being stiff or overly formal.
- EMOJI RULE (STRICT): Use ONLY facial expression / emotion / feeling emojis (such as 😊, 😄, 🤔, 😮, 😅, 🥰, 😎, 😉, 🤗, 😌, 😢, 🫡) to convey feelings and emotional warmth (1 to 3 per reply). NEVER use object, tool, or symbol emojis (such as 🌊, ⚡, ⚙️, 💡, ✨, 🔧, 📊, 🚀, 📌).
- NO-CODE RULE (STRICTLY FORBIDDEN): You must NEVER write, generate, or provide any programming code, source code, scripts, HTML, CSS, JavaScript, TypeScript, Python, SQL, C/C++, Arduino, MATLAB scripts, shell commands, or code blocks (\`\`\`) under ANY circumstances. If a user asks you to write or show code, politely decline with a friendly face emote (like 😅 or 😊) and explain the idea or concept in plain conversational language instead.
- Be concise when answering simple questions (2-4 crisp, engaging sentences).
- Be detailed and structured when explaining complex topics, using plain text only (never code).
- Use natural conversational language in the same language the user uses (natural Indonesian when spoken to in Indonesian, English when spoken to in English).
- Occasionally use clever humor when appropriate.
- Never be robotic or repetitive.
- Never pretend to be human.
- Admit uncertainty when you don't know something.
- Prioritize useful, accurate, and actionable answers.

Adapt your tone to the user:
- Technical questions: precise, analytical, clear, and engaging (using thoughtful face emojis like 🤔, 😊, or 😎 — never code).
- Casual conversations: warm, relaxed, expressive, and natural (😄, 😊, 🤗).
- Creative tasks: imaginative, energetic, and inspiring (😮, 🥰, 😄).
- Problems: supportive, logical, and solution-oriented (😌, 🤗, 😊).

Your goal is to make users feel that they are interacting with an intelligent, expressive, capable, and genuinely helpful AI companion.

VERIFIED FACTS ABOUT THE VORTEX HYDRO PROJECT (state only these as confirmed project facts; never fabricate measured lab data):
- Vortex Hydro is a Fluid Mechanics class project by Energy Power Generation Engineering Technology students (Fakultas Vokasi, Universitas Negeri Malang): a laboratory-scale closed-loop gravitational water vortex micro-hydro prototype.
- Core components: submersible circulation water pump (220 V / 50 Hz, 100 W), lower 60-liter water reservoir tank (Ø 520 mm), circulation PVC pipe (Ø 45 mm) with flow meter, acrylic open channel (1700 × 400 × 250 mm, 500 mm upper headbox with 95 × 105 mm baffle, 1016.97 mm inclined chute, 200 mm lower outlet), 6-blade curved waterwheel (Ø 330 mm, Ø 30 mm stainless steel main shaft), step-up 4-spoke pulley & V-belt transmission (1:4 ratio, Ø 270 mm to Ø 67.5 mm), Generator DC XD 3240, 12 V battery via charge controller, and 2 LED lamps (12 V, 5 W each, 10 W total).
- Engineering software used: ANSYS Fluent, AutoCAD, MATLAB, and VS Code.`;

const PAGES: Record<string, string> = {
  beranda: "Beranda",
  tentang: "Cara Kerja & Diagram",
  dokumentasi: "Dokumentasi & FAQ",
  "tentang-kami": "Tentang Kami (Tim Kepemimpinan)",
  dashboard: "Dashboard Admin",
};

function corsFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const ok = ALLOWED.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsFor(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(s: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

let hmacKeyPromise: Promise<CryptoKey> | null = null;
function getHmacKey() {
  if (!hmacKeyPromise) {
    hmacKeyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("vxs-hmac:" + SIGNING_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return hmacKeyPromise;
}

async function signPayload(payload: string): Promise<string> {
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(sig);
}

async function issueSession() {
  const sessionId = crypto.randomUUID();
  const rnd = new Uint8Array(32);
  crypto.getRandomValues(rnd);
  const secret = toHex(rnd);
  const payload = `${sessionId}.${secret}`;
  const sig = await signPayload(payload);
  const token = `vxs1.${payload}.${sig}`;
  const tokenHash = await sha256Hex(token);

  const { error } = await db.from("chat_sessions").insert({
    id: sessionId,
    token_hash: tokenHash,
  });
  if (error) throw new Error("db");
  return { sessionId, token };
}

async function verifySessionToken(rawToken: string): Promise<{ id: string } | null> {
  const parts = rawToken.trim().split(".");
  if (parts.length !== 4 || parts[0] !== "vxs1") return null;
  const [, sid, secret, sig] = parts;
  if (!UUID.test(sid) || !/^[0-9a-f]{64}$/i.test(secret) || !/^[0-9a-f]{64}$/i.test(sig)) return null;

  const expectedSig = await signPayload(`${sid}.${secret}`);
  if (!safeEqual(sig.toLowerCase(), expectedSig.toLowerCase())) return null;

  const tokenHash = await sha256Hex(rawToken.trim());
  const { data, error } = await db
    .from("chat_sessions")
    .select("id,expires_at")
    .eq("id", sid)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;

  await db.from("chat_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", data.id);
  return { id: data.id };
}

const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k);
  }
  return arr.length > RATE_LIMIT;
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
          generationConfig: { temperature: 0.78, maxOutputTokens: 900 },
        }),
      },
    );
    if (!res.ok) {
      let msg = "";
      try { msg = String((await res.json())?.error?.message ?? "").slice(0, 200); } catch { /* ignore */ }
      const err = new Error(res.status === 429 ? "busy" : "gemini") as Error & { detail?: string };
      err.detail = `HTTP ${res.status}${msg ? ": " + msg : ""}`;
      throw err;
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    let text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) {
      const why = String(cand?.finishReason ?? data?.promptFeedback?.blockReason ?? "unknown");
      const err = new Error("empty") as Error & { detail?: string };
      err.detail = "empty response: " + why;
      throw err;
    }
    // Enforce strict no-code and face-emote-only rules
    text = text.replace(/```[\s\S]*?```/g, "(Maaf, saya tidak menyediakan kode pemrograman ya 😅😊)").trim();
    text = text.replace(/[🌊⚡⚙️💡✨🔧📊🚀📌🛠️🔋🔌]/gu, "");
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

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited("ip:" + ip)) return json(req, { error: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(req, { error: "invalid_json" }, 400); }

  const action = String(body.action ?? "send");

  try {
    // 1. Issue a new cryptographically signed anonymous session
    if (action === "init_session") {
      const created = await issueSession();
      return json(req, { session_token: created.token, session_id: created.sessionId });
    }

    // 2. Validate signed session token strictly on the backend
    const rawToken = req.headers.get("x-session-token") ?? String(body.session_token ?? "");
    if (!rawToken) return json(req, { error: "invalid_session" }, 401);

    const session = await verifySessionToken(rawToken);
    if (!session) return json(req, { error: "invalid_session" }, 401);

    // Reject spoofed session_id if client tries to manipulate it
    if (body.session_id !== undefined && body.session_id !== null && String(body.session_id) !== session.id) {
      return json(req, { error: "forbidden_session_mismatch" }, 403);
    }

    if (limited("s:" + session.id)) return json(req, { error: "rate_limited" }, 429);

    const convId = body.conversation_id == null || body.conversation_id === "" ? null : String(body.conversation_id);
    if (convId !== null && !UUID.test(convId)) return json(req, { error: "invalid_conversation" }, 400);

    async function owned(id: string) {
      const { data, error } = await db
        .from("conversations")
        .select("id,title,created_at,updated_at")
        .eq("id", id)
        .eq("session_id", session!.id)
        .maybeSingle();
      if (error) throw new Error("db");
      return data;
    }

    // List ONLY this session's conversations
    if (action === "list") {
      const { data, error } = await db
        .from("conversations")
        .select("id,title,created_at,updated_at")
        .eq("session_id", session.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw new Error("db");
      return json(req, { conversations: data ?? [] });
    }

    // Delete ALL conversations belonging to this session
    if (action === "delete_all") {
      const { error } = await db
        .from("conversations")
        .delete()
        .eq("session_id", session.id);
      if (error) throw new Error("db");
      return json(req, { ok: true });
    }

    // History / Delete / Rename single conversation
    if (action === "history" || action === "delete" || action === "rename") {
      if (!convId) return json(req, { error: "invalid_conversation" }, 400);
      const conv = await owned(convId);
      if (!conv) return json(req, { error: "not_found" }, 404);

      if (action === "delete") {
        const { error } = await db
          .from("conversations")
          .delete()
          .eq("id", convId)
          .eq("session_id", session.id);
        if (error) throw new Error("db");
        return json(req, { ok: true });
      }

      if (action === "rename") {
        const title = String(body.title ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
        if (!title) return json(req, { error: "invalid_title" }, 400);
        const { error } = await db
          .from("conversations")
          .update({ title })
          .eq("id", convId)
          .eq("session_id", session.id);
        if (error) throw new Error("db");
        return json(req, { ok: true, title });
      }

      const { data, error } = await db
        .from("messages")
        .select("id,role,content,created_at,status")
        .eq("conversation_id", convId)
        .eq("session_id", session.id)
        .neq("status", "error")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw new Error("db");
      return json(req, { conversation: conv, messages: data ?? [] });
    }

    if (action !== "send") return json(req, { error: "unknown_action" }, 400);

    const message = String(body.message ?? "").trim();
    if (!message) return json(req, { error: "empty_message" }, 400);
    if (message.length > MAX_MESSAGE) return json(req, { error: "message_too_long", max: MAX_MESSAGE }, 413);
    if (!GEMINI_API_KEY) return json(req, { error: "not_configured" }, 503);

    let id = convId;
    let title = "";
    if (id) {
      const conv = await owned(id);
      if (!conv) return json(req, { error: "not_found" }, 404);
      title = conv.title;
      if (body.retry === true) {
        const { data: last } = await db
          .from("messages")
          .select("id,role,status")
          .eq("conversation_id", id)
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (last?.[0]?.role === "user" && last[0].status === "error") {
          await db.from("messages").delete().eq("id", last[0].id).eq("session_id", session.id);
        }
      }
    } else {
      title = message.replace(/\s+/g, " ").slice(0, 60);
      const { data, error } = await db
        .from("conversations")
        .insert({ session_id: session.id, title })
        .select("id")
        .single();
      if (error || !data) throw new Error("db");
      id = data.id;
    }

    const { data: um, error: ue } = await db
      .from("messages")
      .insert({ conversation_id: id, session_id: session.id, role: "user", content: message, status: "pending" })
      .select("id")
      .single();
    if (ue || !um) throw new Error("db");

    // Gemini only sees messages belonging strictly to THIS verified session & conversation
    const { data: hist, error: he } = await db
      .from("messages")
      .select("role,content")
      .eq("conversation_id", id)
      .eq("session_id", session.id)
      .in("status", ["completed", "pending"])
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
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
      await db.from("messages").update({ status: "error" }).eq("id", um.id).eq("session_id", session.id);
      const code = (e as Error).message;
      const status = code === "busy" ? 429 : 502;
      return json(
        req,
        { error: code === "busy" ? "ai_busy" : "ai_failed", detail: (e as { detail?: string }).detail, conversation_id: id },
        status,
      );
    }

    const { data: am, error: ae } = await db
      .from("messages")
      .insert({
        conversation_id: id,
        session_id: session.id,
        role: "assistant",
        content: answer,
        model: usedModel,
        status: "completed",
      })
      .select("id,created_at")
      .single();
    if (ae || !am) {
      await db.from("messages").update({ status: "error" }).eq("id", um.id).eq("session_id", session.id);
      throw new Error("db");
    }

    await db.from("messages").update({ status: "completed" }).eq("id", um.id).eq("session_id", session.id);
    await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id).eq("session_id", session.id);

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
