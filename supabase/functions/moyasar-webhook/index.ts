import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Moyasar webhook — the ONLY thing that marks a booking paid. Verifies the
// shared secret Moyasar sends (`secret_token`) against MOYASAR_WEBHOOK_SECRET,
// then idempotently updates the payment + booking. Called by Moyasar, not by an
// authenticated user, so it must be deployed with verify_jwt = false.

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Constant-time-ish string compare to avoid trivial timing leaks.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("MOYASAR_WEBHOOK_SECRET")?.trim();

    // Fail closed if the secret isn't configured.
    if (!webhookSecret) {
      console.error("moyasar-webhook: MOYASAR_WEBHOOK_SECRET is not set");
      return json(503, { error: "Webhook not configured" });
    }

    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: "Invalid JSON" });

    // Verify the shared secret Moyasar includes in the payload.
    const token = body.secret_token ?? "";
    if (typeof token !== "string" || !safeEqual(token, webhookSecret)) {
      console.error("moyasar-webhook: secret_token mismatch");
      return json(401, { error: "Unauthorized" });
    }

    const data = body.data ?? {};
    const invoiceId: string | undefined = data.invoice_id;
    const paymentId: string | undefined = data.id;
    const paymentStatus: string = data.status ?? "";

    if (!invoiceId) {
      // Not an invoice-linked payment we track; ack so Moyasar doesn't retry.
      return json(200, { ok: true, ignored: "no invoice_id" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Find the payment attempt we recorded at create time.
    const { data: payment } = await admin
      .from("payments")
      .select("id, booking_id, status")
      .eq("provider_invoice_id", invoiceId)
      .maybeSingle();

    if (!payment) {
      return json(200, { ok: true, ignored: "unknown invoice" });
    }

    // Idempotent: if already settled paid, do nothing further.
    if (payment.status === "paid") {
      return json(200, { ok: true, idempotent: true });
    }

    const newStatus = paymentStatus === "paid" ? "paid" : paymentStatus === "failed" ? "failed" : "initiated";

    await admin
      .from("payments")
      .update({ status: newStatus, provider_payment_id: paymentId ?? null, raw: body })
      .eq("id", payment.id);

    // On success, mark the booking paid + confirmed (service role bypasses the
    // booking guard, which is exactly why only this verified path can do it).
    if (newStatus === "paid") {
      await admin
        .from("package_bookings")
        .update({ payment_status: "paid", status: "confirmed", payment_reference: paymentId ?? null, payment_method: "moyasar" })
        .eq("id", payment.booking_id);
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error("moyasar-webhook error:", err);
    return json(500, { error: "Internal error" });
  }
});
