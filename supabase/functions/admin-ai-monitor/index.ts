// Vortex Hydro Admin AI Chat Monitoring — Backend (Supabase Edge Function)
// Strict server-side Supabase Auth JWT + Admin Role Verification + Audit Logging.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hdeonngth.github.io,http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000")
  .split(",").map((s) => s.trim()).filter(Boolean);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const adminDb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
    headers: {
      ...corsFor(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function extractBearer(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

async function verifyAdmin(jwt: string) {
  const { data: authData, error: authErr } = await adminDb.auth.getUser(jwt);
  if (authErr || !authData?.user) return { ok: false as const, status: 401, error: "unauthorized" };

  const user = authData.user;
  // Check secure role table OR server-managed app_metadata (NEVER user_metadata!)
  const appRole = (user.app_metadata as Record<string, unknown> | undefined)?.role;
  let isAdmin = appRole === "admin";

  if (!isAdmin) {
    const { data: roleRow, error: roleErr } = await adminDb
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!roleErr && roleRow?.role === "admin") isAdmin = true;
  }

  if (!isAdmin) return { ok: false as const, status: 403, error: "forbidden_admin_only" };
  return { ok: true as const, user };
}

async function logAudit(
  adminUserId: string,
  action: string,
  targetConversationId: string | null = null,
  metadata: Record<string, unknown> = {},
) {
  try {
    await adminDb.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      action,
      target_conversation_id: targetConversationId,
      metadata,
    });
  } catch {
    // Non-blocking audit failure guard
  }
}

async function buildUserMap(): Promise<Map<string, { email: string; ref: string }>> {
  const map = new Map<string, { email: string; ref: string }>();
  try {
    let page = 1;
    while (page <= 10) {
      const { data, error } = await adminDb.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) {
        map.set(u.id, {
          email: u.email ?? "Pengguna Terdaftar",
          ref: u.id.slice(0, 8),
        });
      }
      if (data.users.length < 200) break;
      page++;
    }
  } catch {
    // Fallback to UUID prefix
  }
  return map;
}

function ownerInfo(userId: string | null, userMap: Map<string, { email: string; ref: string }>) {
  if (!userId) return { label: "Sesi Legacy (Anonim)", ref: "legacy" };
  const found = userMap.get(userId);
  if (found) return { label: found.email, ref: found.ref };
  return { label: `User #${userId.slice(0, 8)}`, ref: userId.slice(0, 8) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const jwt = extractBearer(req);
  if (!jwt) return json(req, { error: "unauthorized" }, 401);

  const check = await verifyAdmin(jwt);
  if (!check.ok) return json(req, { error: check.error }, check.status);
  const adminUser = check.user;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(req, { error: "invalid_json" }, 400); }

  // Reject spoofed user_id in request payload
  if (body.user_id !== undefined && body.user_id !== null && String(body.user_id) !== adminUser.id) {
    return json(req, { error: "forbidden_user_mismatch" }, 403);
  }

  const action = String(body.action ?? "stats");

  try {
    if (action === "verify") {
      return json(req, {
        ok: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email ?? "Admin",
        },
      });
    }

    if (action === "stats") {
      const now = new Date();
      const startToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const sevenDaysAgo = new Date(startToday.getTime() - 6 * 86400000);

      const [convRes, msgRes, auditRes] = await Promise.all([
        adminDb.from("conversations").select("id,user_id,created_at,updated_at"),
        adminDb.from("messages").select("id,conversation_id,role,model,status,created_at"),
        adminDb.from("admin_audit_logs").select("id", { count: "exact", head: true }),
      ]);

      if (convRes.error || msgRes.error) throw new Error("db");
      const convs = convRes.data ?? [];
      const msgs = msgRes.data ?? [];

      const uniqueUsers = new Set(convs.map((c) => c.user_id).filter(Boolean)).size;
      const userMsgs = msgs.filter((m) => m.role === "user").length;
      const assistantMsgs = msgs.filter((m) => m.role === "assistant").length;
      const todayConvs = convs.filter((c) => new Date(c.created_at) >= startToday).length;
      const todayMsgs = msgs.filter((m) => new Date(m.created_at) >= startToday).length;

      // 7-day daily activity buckets
      const daily: { date: string; conversations: number; messages: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(sevenDaysAgo.getTime() + d * 86400000);
        const key = dt.toISOString().slice(0, 10);
        daily.push({ date: key, conversations: 0, messages: 0 });
      }
      const dailyMap = new Map(daily.map((d) => [d.date, d]));
      for (const c of convs) {
        const k = String(c.created_at).slice(0, 10);
        const bucket = dailyMap.get(k);
        if (bucket) bucket.conversations++;
      }
      for (const m of msgs) {
        const k = String(m.created_at).slice(0, 10);
        const bucket = dailyMap.get(k);
        if (bucket) bucket.messages++;
      }

      const modelCounts: Record<string, number> = {};
      for (const m of msgs) {
        if (m.role === "assistant" && m.model) {
          modelCounts[m.model] = (modelCounts[m.model] ?? 0) + 1;
        }
      }

      await logAudit(adminUser.id, "view_stats");

      return json(req, {
        stats: {
          total_conversations: convs.length,
          total_messages: msgs.length,
          user_messages: userMsgs,
          assistant_messages: assistantMsgs,
          unique_users: uniqueUsers,
          today_conversations: todayConvs,
          today_messages: todayMsgs,
          audit_logs_count: auditRes.count ?? 0,
          daily,
          models: modelCounts,
        },
      });
    }

    if (action === "list") {
      const q = String(body.q ?? "").trim().toLowerCase();
      const dateFrom = typeof body.date_from === "string" && ISO_DATE.test(body.date_from) ? body.date_from : null;
      const dateTo = typeof body.date_to === "string" && ISO_DATE.test(body.date_to) ? body.date_to : null;
      const limit = Math.min(100, Math.max(1, Number(body.limit) || 50));
      const offset = Math.max(0, Number(body.offset) || 0);

      let convQuery = adminDb
        .from("conversations")
        .select("id,user_id,title,created_at,updated_at")
        .order("updated_at", { ascending: false });

      if (dateFrom) convQuery = convQuery.gte("created_at", `${dateFrom}T00:00:00.000Z`);
      if (dateTo) convQuery = convQuery.lte("created_at", `${dateTo}T23:59:59.999Z`);

      const [convRes, msgRes, userMap] = await Promise.all([
        convQuery.limit(500),
        adminDb.from("messages").select("conversation_id,role,content,created_at").order("created_at", { ascending: true }).limit(5000),
        buildUserMap(),
      ]);

      if (convRes.error || msgRes.error) throw new Error("db");
      const allConvs = convRes.data ?? [];
      const allMsgs = msgRes.data ?? [];

      const msgByConv = new Map<string, { count: number; preview: string; searchable: string }>();
      for (const m of allMsgs) {
        const entry = msgByConv.get(m.conversation_id) ?? { count: 0, preview: "", searchable: "" };
        entry.count++;
        entry.preview = String(m.content ?? "").replace(/\s+/g, " ").slice(0, 120);
        entry.searchable += " " + String(m.content ?? "").toLowerCase();
        msgByConv.set(m.conversation_id, entry);
      }

      const filtered = allConvs.filter((c) => {
        if (!q) return true;
        const owner = ownerInfo(c.user_id, userMap);
        const info = msgByConv.get(c.id);
        return (
          String(c.title ?? "").toLowerCase().includes(q) ||
          owner.label.toLowerCase().includes(q) ||
          owner.ref.toLowerCase().includes(q) ||
          (info?.searchable.includes(q) ?? false)
        );
      });

      const pageItems = filtered.slice(offset, offset + limit).map((c) => {
        const owner = ownerInfo(c.user_id, userMap);
        const info = msgByConv.get(c.id);
        return {
          id: c.id,
          title: c.title,
          owner_label: owner.label,
          owner_ref: owner.ref,
          message_count: info?.count ?? 0,
          last_preview: info?.preview ?? "",
          created_at: c.created_at,
          updated_at: c.updated_at,
        };
      });

      await logAudit(adminUser.id, "list_conversations", null, { q: q || null, date_from: dateFrom, date_to: dateTo, total: filtered.length });

      return json(req, {
        total: filtered.length,
        conversations: pageItems,
      });
    }

    if (action === "detail") {
      const convId = String(body.conversation_id ?? "");
      if (!UUID.test(convId)) return json(req, { error: "invalid_conversation" }, 400);

      const [convRes, msgRes, userMap] = await Promise.all([
        adminDb.from("conversations").select("id,user_id,title,created_at,updated_at").eq("id", convId).maybeSingle(),
        adminDb.from("messages").select("id,role,content,model,status,created_at").eq("conversation_id", convId).order("created_at", { ascending: true }).limit(500),
        buildUserMap(),
      ]);

      if (convRes.error || msgRes.error) throw new Error("db");
      if (!convRes.data) return json(req, { error: "not_found" }, 404);

      const owner = ownerInfo(convRes.data.user_id, userMap);
      await logAudit(adminUser.id, "view_conversation", convId);

      return json(req, {
        conversation: {
          id: convRes.data.id,
          title: convRes.data.title,
          owner_label: owner.label,
          owner_ref: owner.ref,
          created_at: convRes.data.created_at,
          updated_at: convRes.data.updated_at,
        },
        messages: msgRes.data ?? [],
      });
    }

    if (action === "delete") {
      const convId = String(body.conversation_id ?? "");
      if (!UUID.test(convId)) return json(req, { error: "invalid_conversation" }, 400);

      const { data: existing, error: findErr } = await adminDb
        .from("conversations")
        .select("id,title")
        .eq("id", convId)
        .maybeSingle();
      if (findErr) throw new Error("db");
      if (!existing) return json(req, { error: "not_found" }, 404);

      const { error: delErr } = await adminDb.from("conversations").delete().eq("id", convId);
      if (delErr) throw new Error("db");

      await logAudit(adminUser.id, "delete_conversation", convId, { title: existing.title });

      return json(req, { ok: true, deleted_id: convId });
    }

    if (action === "audit_logs") {
      const [logsRes, userMap] = await Promise.all([
        adminDb
          .from("admin_audit_logs")
          .select("id,admin_user_id,action,target_conversation_id,metadata,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        buildUserMap(),
      ]);
      if (logsRes.error) throw new Error("db");

      const logs = (logsRes.data ?? []).map((l) => ({
        id: l.id,
        admin_label: ownerInfo(l.admin_user_id, userMap).label,
        action: l.action,
        target_conversation_id: l.target_conversation_id,
        metadata: l.metadata,
        created_at: l.created_at,
      }));
      return json(req, { logs });
    }

    return json(req, { error: "unknown_action" }, 400);
  } catch (e) {
    console.error("admin_monitor_error", (e as Error).message);
    return json(req, { error: "server_error" }, 500);
  }
});
