import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-only refund of a paid payment, routed through Moyasar. The client
// never mutates payments.status directly (there is deliberately no admin
// UPDATE policy on payments) — this function verifies the caller has the
// admin role, issues the refund at the provider, then reconciles the
// payment + booking rows and writes the audit trail with the service role.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { code: "METHOD_NOT_ALLOWED", error: "Method not allowed" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const moyasarSecret = Deno.env.get("MOYASAR_SECRET_KEY")?.trim();

    if (!moyasarSecret) {
      return json(503, { code: "PAYMENTS_NOT_CONFIGURED", error: "Payments are not configured" });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(401, { code: "AUTH_REQUIRED", error: "Authentication required" });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Only admins may refund.
    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return json(403, { code: "FORBIDDEN", error: "Admin role required" });

    const payload = await req.json().catch(() => null);
    const payment_id = payload?.payment_id;
    const reason: string = typeof payload?.reason === "string" ? payload.reason.slice(0, 500) : "";
    if (!payment_id || typeof payment_id !== "string") {
      return json(400, { code: "INVALID_BODY", error: "payment_id is required" });
    }

    const { data: payment, error: pErr } = await admin
      .from("payments")
      .select("id, booking_id, status, amount, provider_invoice_id, provider_payment_id")
      .eq("id", payment_id)
      .maybeSingle();
    if (pErr || !payment) return json(404, { code: "PAYMENT_NOT_FOUND", error: "Payment not found" });
    if (payment.status === "refunded") return json(409, { code: "ALREADY_REFUNDED", error: "Payment is already refunded" });
    if (payment.status !== "paid") return json(409, { code: "NOT_REFUNDABLE", error: "Only paid payments can be refunded" });

    const moyasarAuth = { Authorization: `Basic ${btoa(`${moyasarSecret}:`)}` };

    // The webhook stores the Moyasar payment id when the invoice settles; for
    // older rows fall back to reading it off the invoice.
    let providerPaymentId = payment.provider_payment_id as string | null;
    if (!providerPaymentId && payment.provider_invoice_id) {
      const invResp = await fetch(`https://api.moyasar.com/v1/invoices/${payment.provider_invoice_id}`, { headers: moyasarAuth });
      const invoice = await invResp.json().catch(() => null);
      providerPaymentId = invoice?.payments?.find((p: { status: string }) => p.status === "paid")?.id ?? null;
    }
    if (!providerPaymentId) {
      return json(502, { code: "PROVIDER_PAYMENT_MISSING", error: "Provider payment reference not found" });
    }

    // Full refund at the provider. Moyasar treats a repeat refund of an
    // already-refunded payment as an error, which we surface as-is.
    const refundResp = await fetch(`https://api.moyasar.com/v1/payments/${providerPaymentId}/refund`, {
      method: "POST",
      headers: { ...moyasarAuth, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const refunded = await refundResp.json().catch(() => null);
    if (!refundResp.ok || refunded?.status !== "refunded") {
      console.error("Moyasar refund failed:", refundResp.status, refunded);
      return json(502, { code: "PROVIDER_ERROR", error: "Provider refused the refund" });
    }

    // Reconcile our records (webhook may also confirm this later; both paths
    // are idempotent).
    await admin
      .from("payments")
      .update({ status: "refunded", provider_payment_id: providerPaymentId, raw: refunded })
      .eq("id", payment.id);

    await admin
      .from("package_bookings")
      .update({ payment_status: "refunded", status: "cancelled" })
      .eq("id", payment.booking_id);

    // Audit trail, server-side so it can't be skipped by the client.
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Admin";
    await admin.from("admin_activity_logs").insert({
      user_id: user.id,
      user_name: userName,
      action_type: "refund",
      action_description: `Refunded payment ${payment.id} (SAR ${payment.amount}) for booking ${payment.booking_id}${reason ? ` — ${reason}` : ""}`,
      entity_type: "payment",
      entity_id: payment.id,
      metadata: { booking_id: payment.booking_id, amount: payment.amount, provider_payment_id: providerPaymentId, reason },
    });

    return json(200, { ok: true, payment_id: payment.id, status: "refunded" });
  } catch (err) {
    console.error("admin-refund error:", err);
    return json(500, { code: "INTERNAL", error: "Internal error" });
  }
});
