import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Creates a Moyasar hosted invoice for a booking and records the attempt.
// The client never supplies the amount — it's read from the booking server-side.
// The booking is only marked paid later by the verified moyasar-webhook.

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
    const moyasarSecret = Deno.env.get("MOYASAR_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL") ?? "";

    if (!moyasarSecret) {
      return json(503, { code: "PAYMENTS_NOT_CONFIGURED", error: "Payments are not configured" });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(401, { code: "AUTH_REQUIRED", error: "Authentication required" });

    const payload = await req.json().catch(() => null);
    const booking_id = payload?.booking_id;
    if (!booking_id || typeof booking_id !== "string") {
      return json(400, { code: "INVALID_BODY", error: "booking_id is required" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Load the booking; must belong to the caller and not already be paid.
    const { data: booking, error: bErr } = await admin
      .from("package_bookings")
      .select("id, traveler_id, total_price, payment_status, package_id")
      .eq("id", booking_id)
      .maybeSingle();
    if (bErr || !booking) return json(404, { code: "BOOKING_NOT_FOUND", error: "Booking not found" });
    if (booking.traveler_id !== user.id) return json(403, { code: "FORBIDDEN", error: "Not your booking" });
    if (booking.payment_status === "paid") return json(409, { code: "ALREADY_PAID", error: "Booking is already paid" });

    const amountHalalas = Math.round(Number(booking.total_price) * 100);
    if (amountHalalas <= 0) return json(400, { code: "INVALID_AMOUNT", error: "Booking amount is invalid" });

    const callbackUrl = `${appUrl}/payment/callback?booking=${booking_id}`;

    // Create the Moyasar invoice (hosted payment page).
    const form = new URLSearchParams();
    form.set("amount", String(amountHalalas));
    form.set("currency", "SAR");
    form.set("description", `ToTravel booking ${booking_id}`);
    form.set("callback_url", callbackUrl);
    form.set("metadata[booking_id]", booking_id);

    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${moyasarSecret}:`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const invoice = await resp.json().catch(() => null);
    if (!resp.ok || !invoice?.id || !invoice?.url) {
      console.error("Moyasar invoice creation failed:", resp.status, invoice);
      return json(502, { code: "PROVIDER_ERROR", error: "Could not start payment" });
    }

    // Record the attempt (webhook links back via provider_invoice_id).
    await admin.from("payments").insert({
      booking_id,
      provider: "moyasar",
      provider_invoice_id: invoice.id,
      amount: Number(booking.total_price),
      currency: "SAR",
      status: "initiated",
    });

    return json(201, { url: invoice.url, invoice_id: invoice.id });
  } catch (err) {
    console.error("create-payment error:", err);
    return json(500, { code: "INTERNAL", error: "Internal error" });
  }
});
