import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import React from "react";
import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
  Tailwind,
} from "@react-email/components";
import { render } from "@react-email/render";

// Environment Variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@phsport.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NotificationPayload {
  id: string;
  user_id: string;
  type: string; // 'assignment' | 'comment' | 'deadline' | 'status_change'
  title: string;
  message: string | null;
  link: string | null;
  meta?: {
    assignment_count?: number;
    design_title?: string;
  } | null;
  delivery_id?: string;
  idempotency_key?: string;
  created_at: string;
}

interface NotificationPreferences {
  email: Record<string, boolean>;
  in_app: Record<string, boolean>;
}

interface UserProfile {
  notification_preferences: NotificationPreferences | null;
  full_name: string | null;
}

interface EmailCopy {
  subject: string;
  preview: string;
  headline: string;
  bodyMessage: string;
  ctaText: string;
  ctaUrl: string;
}

interface TemplateProps {
  greetingName: string;
  copy: EmailCopy;
}

interface DeliveryRecord {
  id: string;
  status: "queued" | "sending" | "sent" | "failed" | "timeout" | "skipped";
  attempt_count: number;
}

const MAX_EMAIL_ATTEMPTS = 3;

const nextRetryAtFromAttempt = (attemptCount: number): string | null => {
  if (attemptCount >= MAX_EMAIL_ATTEMPTS) return null;
  const minutes = attemptCount <= 1 ? 1 : attemptCount === 2 ? 5 : 15;
  return new Date(Date.now() + minutes * 60_000).toISOString();
};

// --- Helpers ---

const getGreetingName = (fullName: string | null | undefined): string => {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] || "";
};

const getAssignmentCount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return null;
};

const getDesignTitle = (notification: NotificationPayload): string | null => {
  const fromMeta = notification.meta?.design_title;
  if (typeof fromMeta === "string" && fromMeta.trim().length > 0) {
    return fromMeta.trim();
  }

  const fromTitle = notification.title?.trim();
  if (fromTitle && fromTitle.toLowerCase() !== "nueva asignación") {
    return fromTitle;
  }

  const fromMessage = notification.message?.match(/"([^"]+)"/)?.[1];
  return fromMessage?.trim() || null;
};

const normalizeLink = (link: string | null | undefined, fallback: string): string =>
  `https://phsport.app${link || fallback}`;

const buildEmailCopy = (notification: NotificationPayload): EmailCopy => {
  switch (notification.type) {
    case "assignment": {
      const assignmentCount = getAssignmentCount(notification.meta?.assignment_count);
      const designTitle = getDesignTitle(notification);

      if (assignmentCount && assignmentCount > 1) {
        return {
          subject: `Tienes ${assignmentCount} nuevos diseños en PH Sport`,
          preview: `Se te han asignado ${assignmentCount} diseños para esta semana`,
          headline: `Tienes ${assignmentCount} nuevos diseños`,
          bodyMessage:
            notification.message || `Se te han asignado ${assignmentCount} nuevos diseños.`,
          ctaText: "Ver mis asignaciones",
          ctaUrl: normalizeLink(notification.link, "/my-week"),
        };
      }

      if (designTitle) {
        return {
          subject: `Nuevo diseño asignado: ${designTitle}`,
          preview: `Tienes un nuevo diseño pendiente en PH Sport`,
          headline: "Te han asignado un nuevo diseño",
          bodyMessage:
            notification.message || `Ya tienes disponible el diseño "${designTitle}".`,
          ctaText: "Ver diseño",
          ctaUrl: normalizeLink(notification.link, "/my-week"),
        };
      }

      return {
        subject: "Nueva asignación en PH Sport",
        preview: "Tienes nuevas tareas pendientes por revisar",
        headline: "Tienes una nueva asignación",
        bodyMessage: notification.message || "Revisa tu panel para ver los detalles.",
        ctaText: "Ver asignación",
        ctaUrl: normalizeLink(notification.link, "/my-week"),
      };
    }
    case "comment":
      return {
        subject: `Nuevo comentario en ${notification.title}`,
        preview: "Hay una actualización en una de tus comunicaciones",
        headline: "Tienes un nuevo comentario",
        bodyMessage:
          notification.message || "Han respondido en una conversación de diseño.",
        ctaText: "Responder",
        ctaUrl: normalizeLink(notification.link, "/communications"),
      };
    case "deadline":
      return {
        subject: `Vence pronto: ${notification.title}`,
        preview: "Revisa la fecha límite y prioriza esta tarea",
        headline: "Fecha límite próxima",
        bodyMessage:
          notification.message ||
          "Hay un diseño con deadline próximo que requiere tu atención.",
        ctaText: "Ver detalles",
        ctaUrl: normalizeLink(notification.link, "/my-week"),
      };
    default:
      return {
        subject: `Notificación: ${notification.title}`,
        preview: "Tienes una nueva notificación en PH Sport",
        headline: "Tienes una nueva notificación",
        bodyMessage: notification.message || notification.title,
        ctaText: "Ir al dashboard",
        ctaUrl: normalizeLink(notification.link, "/dashboard"),
      };
  }
};

// --- Components ---

const EmailLayout = ({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              primary: "#d6b25e",
              brand: {
                fg: "#0d0f12",
              },
              gray: {
                50: "#FAFAFA",
                100: "#F5F5F5",
                200: "#E5E5E5",
                500: "#737373",
                800: "#171717",
                900: "#0A0A0A",
              },
            },
            fontFamily: {
              sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
            },
          },
        },
      }}
    >
      <Body className="bg-gray-50 my-auto mx-auto font-sans">
        <Container className="border border-solid border-gray-200 rounded-[14px] my-[40px] mx-auto p-[32px] max-w-[560px] bg-white text-gray-800 shadow-sm">
          <Section className="mb-[20px]">
            <div className="h-[4px] w-full rounded-full bg-primary" />
          </Section>
          <Section className="mt-[6px] mb-[20px] text-center">
            <Img
              src="https://phsport.app/images/logo-ph-sport-gold.svg"
              width="120"
              height="96"
              alt="PH Sport"
              className="mx-auto"
              style={{ height: 'auto' }}
            />
          </Section>

          {children}

          <Hr className="border border-solid border-gray-200 my-[28px] mx-0 w-full" />

          <Text className="text-gray-500 text-[12px] leading-[20px] text-center m-0">
            Recibes este correo porque tienes notificaciones activas en tu cuenta de PH Sport.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

const AssignmentTemplate = ({ greetingName, copy }: TemplateProps) => (
  <EmailLayout preview={copy.preview}>
    <Section className="mt-[16px] text-center">
      <Text className="text-[14px] leading-[22px] text-gray-500 mt-0 mb-[10px]">
        {greetingName ? `Hola, ${greetingName}` : "Hola"}
      </Text>
      <Heading className="text-[28px] font-semibold text-gray-900 text-center p-0 my-0 mx-0">
        {copy.headline}
      </Heading>
      <Text className="text-[15px] leading-[26px] text-gray-500 mt-[18px] mb-[24px]">
        {copy.bodyMessage}
      </Text>
      <Section className="text-center mt-[24px] mb-[30px]">
        <Button
          className="bg-primary rounded-[8px] text-brand-fg text-[14px] font-semibold no-underline text-center px-7 py-3"
          href={copy.ctaUrl}
        >
          {copy.ctaText}
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

const CommentTemplate = ({ greetingName, copy }: TemplateProps) => (
  <EmailLayout preview={copy.preview}>
    <Section className="mt-[16px]">
      <Text className="text-[14px] leading-[22px] text-gray-500 text-center mt-0 mb-[10px]">
        {greetingName ? `Hola, ${greetingName}` : "Hola"}
      </Text>
      <Heading className="text-[28px] font-semibold text-center text-gray-900 p-0 my-0 mx-0">
        {copy.headline}
      </Heading>

      <Section className="bg-gray-50 p-4 rounded-[10px] border-l-4 border-primary my-6">
        <Text className="text-gray-500 text-[14px] italic m-0">
          "{copy.bodyMessage}"
        </Text>
      </Section>

      <Section className="text-center mt-[24px] mb-[30px]">
        <Button
          className="bg-primary rounded-[8px] text-brand-fg text-[14px] font-semibold no-underline text-center px-7 py-3"
          href={copy.ctaUrl}
        >
          {copy.ctaText}
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

const DeadlineTemplate = ({ greetingName, copy }: TemplateProps) => (
  <EmailLayout preview={copy.preview}>
    <Section className="mt-[16px] text-center">
      <Text className="text-[14px] leading-[22px] text-gray-500 mt-0 mb-[10px]">
        {greetingName ? `Hola, ${greetingName}` : "Hola"}
      </Text>
      <Heading className="text-[28px] font-semibold text-center p-0 my-0 mx-0 text-primary">
        {copy.headline}
      </Heading>

      <Section className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 my-6">
        <Text className="text-[16px] leading-[26px] text-gray-700 m-0">
          {copy.bodyMessage}
        </Text>
      </Section>

      <Section className="text-center mt-[24px] mb-[30px]">
        <Button
          className="bg-primary rounded-[8px] text-brand-fg text-[14px] font-semibold no-underline text-center px-7 py-3"
          href={copy.ctaUrl}
        >
          {copy.ctaText}
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

const DefaultTemplate = ({ greetingName, copy }: TemplateProps) => (
  <EmailLayout preview={copy.preview}>
    <Section className="mt-[16px] text-center">
      <Text className="text-[14px] leading-[22px] text-gray-500 mt-0 mb-[10px]">
        {greetingName ? `Hola, ${greetingName}` : "Hola"}
      </Text>
      <Heading className="text-[28px] font-semibold text-center p-0 my-0 mx-0 text-gray-900">
        {copy.headline}
      </Heading>
      <Text className="text-[15px] leading-[26px] text-gray-500 mt-[18px] mb-[24px]">
        {copy.bodyMessage}
      </Text>
      <Section className="text-center mt-[24px] mb-[30px]">
        <Button
          className="bg-primary rounded-[8px] text-brand-fg text-[14px] font-semibold no-underline text-center px-7 py-3"
          href={copy.ctaUrl}
        >
          {copy.ctaText}
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  let supabase: ReturnType<typeof createClient> | null = null;
  let deliveryId: string | null = null;
  let deliveryAttemptCount = 0;

  try {
    const notification: NotificationPayload = await req.json();
    console.log("Received notification:", notification);

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), { status: 500 });
    }

    // Initialize Supabase Client (Service Role for Admin Access)
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optional outbox delivery tracking context
    deliveryId = notification.delivery_id?.trim() || null;
    if (deliveryId) {
      const { data: deliveryData, error: deliveryError } = await supabase
        .from("notification_email_deliveries")
        .select("id, status, attempt_count")
        .eq("id", deliveryId)
        .single();

      if (deliveryError || !deliveryData) {
        console.error("Delivery record not found:", deliveryError);
        return new Response(JSON.stringify({ error: "Delivery record not found" }), { status: 404 });
      }

      const delivery = deliveryData as DeliveryRecord;
      deliveryAttemptCount = delivery.attempt_count;

      if (delivery.status === "sent" || delivery.status === "skipped") {
        return new Response(JSON.stringify({ success: true, duplicate: true }), { status: 200 });
      }

      await supabase
        .from("notification_email_deliveries")
        .update({
          status: "sending",
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryId);
    }

    // 1. Get User Email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(notification.user_id);
    if (userError || !userData?.user?.email) {
      console.error("Error getting user email:", userError);
      return new Response(JSON.stringify({ error: "User or Email not found" }), { status: 404 });
    }
    const userEmail = userData.user.email;

    // 2. Get User Preferences
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("notification_preferences, full_name")
      .eq("id", notification.user_id)
      .single();

    if (profileError) {
      console.error("Error getting preferences:", profileError);
      // Fallback to sending if profile fetch fails? Better safe than noisy: abort.
      return new Response(JSON.stringify({ error: "Profile/Preferences not found" }), { status: 404 });
    }

    const profile = profileData as UserProfile;

    // Defaults for notification preferences
    const defaultEmailPrefs: Record<string, boolean> = {
      assignment: true,
      comment: true,
      deadline: true,
      status_change: true,
    };

    const preferences: NotificationPreferences = profile.notification_preferences || {
      email: { ...defaultEmailPrefs },
      in_app: { assignment: true, comment: true, deadline: true, status_change: true },
    };

    // Ensure email preferences object exists and merge with defaults
    if (!preferences.email) {
      preferences.email = { ...defaultEmailPrefs };
    }

    // 3. Check Logic: Is email enabled for this type?
    const type = notification.type;
    // Fallback to true if key doesn't exist (backwards compatible)
    const isEnabled = preferences.email[type] ?? defaultEmailPrefs[type] ?? true;

    if (!isEnabled) {
      console.log(`Email skipped: User disabled emails for type '${type}'`);
      if (deliveryId) {
        await supabase
          .from("notification_email_deliveries")
          .update({
            status: "skipped",
            sent_at: new Date().toISOString(),
            next_retry_at: null,
            last_error: "Skipped due to user notification preference",
            updated_at: new Date().toISOString(),
          })
          .eq("id", deliveryId);
      }
      return new Response(JSON.stringify({ skipped: true, reason: "User preference" }), { status: 200 });
    }

    const greetingName = getGreetingName(profile.full_name);
    const copy = buildEmailCopy(notification);

    // 4. Select Template & Render HTML
    let emailHtml = "";
    let subject = copy.subject;

    switch (type) {
      case "assignment":
        emailHtml = await render(<AssignmentTemplate greetingName={greetingName} copy={copy} />);
        break;
      case "comment":
        emailHtml = await render(<CommentTemplate greetingName={greetingName} copy={copy} />);
        break;
      case "deadline":
        emailHtml = await render(<DeadlineTemplate greetingName={greetingName} copy={copy} />);
        break;
      default:
        emailHtml = await render(<DefaultTemplate greetingName={greetingName} copy={copy} />);
    }
    subject = subject.replace(/[\r\n]+/g, " ").trim();

    // 5. Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `PH Sport <${FROM_EMAIL}>`,
        to: [userEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API Error:", resendData);
      if (deliveryId) {
        const isTransient = resendResponse.status >= 500 || resendResponse.status === 429;
        const nextRetryAt = isTransient
          ? nextRetryAtFromAttempt(deliveryAttemptCount)
          : null;

        await supabase
          .from("notification_email_deliveries")
          .update({
            status: "failed",
            last_error: JSON.stringify(resendData).slice(0, 1000),
            next_retry_at: nextRetryAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", deliveryId);
      }
      return new Response(JSON.stringify({ error: resendData }), { status: 400 });
    }

    console.log("Email sent successfully:", resendData);
    if (deliveryId) {
      await supabase
        .from("notification_email_deliveries")
        .update({
          status: "sent",
          provider_message_id: resendData.id ?? null,
          sent_at: new Date().toISOString(),
          next_retry_at: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryId);
    }
    return new Response(JSON.stringify({ success: true, id: resendData.id }), { status: 200 });

  } catch (error) {
    console.error("Edge Function Exception:", error);
    if (supabase && deliveryId) {
      const rawError = String(error);
      const status = /timeout/i.test(rawError) ? "timeout" : "failed";
      const nextRetryAt = nextRetryAtFromAttempt(deliveryAttemptCount);

      await supabase
        .from("notification_email_deliveries")
        .update({
          status,
          last_error: rawError.slice(0, 1000),
          next_retry_at: nextRetryAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryId);
    }
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
