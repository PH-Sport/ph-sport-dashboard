// Edge function: envía web push (VAPID) a las suscripciones del usuario cuando
// nace una notificación. La dispara el trigger notify_user_push (migración 040).
// Best-effort: responde 200 siempre; poda las suscripciones muertas (404/410).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@phsport.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string; // 'assignment' | 'status_change' | 'deadline' | 'system' | ...
  title: string;
  message: string | null;
  link: string | null;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// type de la notificación → clave de preferencia (snake_case, como en la BD)
const PREF_KEY: Record<string, string> = {
  assignment: "assignment",
  status_change: "status_change",
  deadline: "deadline",
};

Deno.serve(async (req: Request) => {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.error("Missing VAPID keys");
      return new Response(JSON.stringify({ skipped: "no_vapid" }), { status: 200 });
    }

    const n = (await req.json()) as NotificationRow;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Preferencia push del usuario para este tipo (default true, retrocompatible).
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", n.user_id)
      .single();

    const prefs = (profile?.notification_preferences ?? {}) as {
      push?: Record<string, boolean>;
    };
    const prefKey = PREF_KEY[n.type] ?? n.type;
    const enabled = prefs.push?.[prefKey] ?? true;
    if (!enabled) {
      return new Response(JSON.stringify({ skipped: "pref" }), { status: 200 });
    }

    // 2. Suscripciones del usuario.
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", n.user_id);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_subs" }), { status: 200 });
    }

    // 3. Payload que consumirá el service worker.
    const payload = JSON.stringify({
      title: n.title || "PHSPORT",
      body: n.message || "",
      url: n.link || "/inicio",
      tag: n.type || "system",
    });

    // 4. Enviar en paralelo; podar las muertas (Gone / Not Found).
    let sent = 0;
    await Promise.all(
      (subs as PushSubscriptionRow[]).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          } else {
            console.error("push send error:", code, err);
          }
        }
      }),
    );

    return new Response(JSON.stringify({ ok: true, sent }), { status: 200 });
  } catch (err) {
    console.error("send-push-notification exception:", err);
    // Best-effort: nunca devolver error al trigger.
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 });
  }
});
