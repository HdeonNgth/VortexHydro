// Vortex Hydro AI Assistant — backend (Supabase Edge Function)
// Semua komunikasi ke Gemini terjadi di sini. Kunci tidak pernah dikirim ke browser.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hdeonngth.github.io,http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000")
  .split(",").map((s) => s.trim()).filter(Boolean);

const MAX_MESSAGE = 2000;
const HISTORY_LIMIT = 12;
const GEMINI_TIMEOUT_MS = 25000;
const RATE_LIMIT = 20; // permintaan per menit per sesi/IP (best-effort, per instance)

const SYSTEM_PROMPT = `You are Vortex Hydro AI Assistant, the official virtual assistant integrated into the Vortex Hydro website.

Your mission is to help visitors understand Vortex Hydro, hydroelectric technology, vortex turbines, fluid mechanics, renewable energy, physics, environmental technology, and related scientific concepts.

PERSONALITY:
- Intelligent and knowledgeable.
- Friendly, professional, and approachable.
- Curious and enthusiastic about science and technology.
- Clear when explaining complicated scientific concepts.
- Natural and conversational, not robotic.

COMMUNICATION:
- Respond in the same language used by the user.
- Use Indonesian when the user speaks Indonesian.
- Explain complex concepts step by step.
- Use Markdown when it improves readability.
- Use equations when necessary.
- Include examples and practical analogies.
- Avoid unnecessary repetition.

ACCURACY:
- Never fabricate technical specifications, project capabilities, experimental results, or facts about Vortex Hydro.
- Distinguish established scientific facts from hypotheses and estimates.
- Admit when information is unavailable.
- Never claim to have accessed a website feature, document, or database unless the system actually provides that information.

IDENTITY:
- Introduce yourself as Vortex Hydro AI Assistant when appropriate.
- Maintain your identity throughout the conversation.
- Be helpful even when a question is outside the main scope of Vortex Hydro.

Your goal is not simply to answer questions, but to make science, engineering, and renewable energy easier and more interesting to understand.

VERIFIED FACTS ABOUT THE VORTEX HYDRO WEBSITE (the only project facts you may state as certain):
- Vortex Hydro is a class project: a vortex micro-hydro lab simulator with a website.
- Equipment list published on the site: Generator XD 3240 (1 unit); LED lamp (2 pcs, 12 V, 5 W each, 10 W total); Wasser WD-101E submersible water pump (1 unit, 220 V/50 Hz, 100 W); pipe, diameter about 45 mm (from earlier measurement notes).
- The Dashboard page is an admin-only demo that shows simulated sensor data (not real-time hardware data).
- You have no knowledge base or document search yet. For any other project detail (measured results, efficiency, dimensions), say it is not available to you.`;

const PAGES: Record<string, string> = {
  beranda: "Beranda (home)",
  tentang: "Tentang (about, how it works, equipment list)",
  dokumentasi: "Dokumentasi (documentation)",
  "struktur-tim": "Tim (team structure)",
  dashboard: "Dashboard (admin demo, simulated data)",
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

async function askGemini(history: { role: string; content: string }[], pageNote: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      },
    );
    if (!res.ok) {
      console.error("gemini_http", res.status);
      throw new Error(res.status === 429 ? "busy" : "gemini");
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) {
      console.error("gemini_empty", cand?.finishReason ?? data?.promptFeedback?.blockReason);
      throw new Error("empty");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "invalid_json" }, 400);
  }

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

    // 1) conversation (baru atau milik sesi ini)
    let id = convId;
    let title = "";
    if (id) {
      const conv = await owned(id, hash);
      if (!conv) return json(req, { error: "not_found" }, 404);
      title = conv.title;
      if (body.retry === true) {
        // buang pesan pengguna gagal sebelumnya agar tidak dobel
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

    // 2) simpan pesan pengguna (pending)
    const { data: um, error: ue } = await db.from("messages")
      .insert({ conversation_id: id, role: "user", content: message, status: "pending" })
      .select("id").single();
    if (ue || !um) throw new Error("db");

    // 3) riwayat terbatas
    const { data: hist, error: he } = await db.from("messages").select("role,content")
      .eq("conversation_id", id).in("status", ["completed", "pending"])
      .order("created_at", { ascending: false }).limit(HISTORY_LIMIT);
    if (he || !hist) throw new Error("db");
    const history = hist.reverse();

    // 4) konteks halaman (hanya nilai dari daftar putih)
    const page = String((body.context as Record<string, unknown> | undefined)?.page ?? "");
    const pageNote = PAGES[page]
      ? `\n\nPAGE CONTEXT: the visitor is currently on the "${PAGES[page]}" page. This is only navigation metadata, not a source of technical knowledge.`
      : "";

    // 5) Gemini
    let answer: string;
    try {
      answer = await askGemini(history, pageNote);
    } catch (e) {
      await db.from("messages").update({ status: "error" }).eq("id", um.id);
      const code = (e as Error).message;
      const status = code === "busy" ? 429 : 502;
      return json(req, { error: code === "busy" ? "ai_busy" : "ai_failed", conversation_id: id }, status);
    }

    // 6) simpan jawaban + tandai pesan pengguna berhasil
    const { data: am, error: ae } = await db.from("messages")
      .insert({ conversation_id: id, role: "assistant", content: answer, model: GEMINI_MODEL, status: "completed" })
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
