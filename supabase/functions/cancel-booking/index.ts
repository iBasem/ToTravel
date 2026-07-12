import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Cancels a traveler's own booking. Only pending/unpaid bookings can be
// cancelled here — paid bookings must go through the admin-refund flow
// (refunds are never a client-side status flip). Setting status='cancelled'
// releases the seats automatically: the capacity trigger derives availability
// by summing participants of non-cancelled bookings (see
// 20260705100400_bus2_booking_capacity.sql / 20260705140000_wiz11b).

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { code: "METHOD_NOT_ALLOWED", error: "Method not allowed" });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify the caller from their JWT (gateway has already verified it)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return json(401, { code: "AUTH_REQUIRED", error: "Authentication required" });
    }

    const payload = await req.json().catch(() => null);
    const booking_id = payload?.booking_id;
    if (!booking_id || typeof booking_id !== "string") {
      return json(400, { code: "INVALID_BODY", error: "booking_id is required" });
    }

    // Service-role client: trusted reads/writes independent of RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: booking, error: bErr } = await adminClient
      .from("package_bookings")
      .select("id, traveler_id, status, payment_status")
      .eq("id", booking_id)
      .maybeSingle();
    if (bErr || !booking) {
      return json(404, { code: "BOOKING_NOT_FOUND", error: "Booking not found" });
    }
    if (booking.traveler_id !== user.id) {
      return json(403, { code: "NOT_YOUR_BOOKING", error: "Not your booking" });
    }

    if (booking.status === "cancelled") {
      // Idempotent: cancelling twice is not an error.
      return json(200, { ok: true, already_cancelled: true });
    }
    if (booking.status === "completed") {
      return json(409, { code: "BOOKING_COMPLETED", error: "A completed booking cannot be cancelled" });
    }
    // Money has moved — cancellation must go through the refund flow so the
    // payment is reconciled (moyasar-webhook / admin-refund), never flipped here.
    if (booking.payment_status === "paid" || booking.payment_status === "refunded") {
      return json(409, { code: "BOOKING_PAID", error: "Paid bookings are cancelled via a refund — please contact support" });
    }

    const { error: updateError } = await adminClient
      .from("package_bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    if (updateError) {
      console.error("Booking cancel failed:", updateError);
      return json(500, { code: "CANCEL_FAILED", error: "Failed to cancel booking" });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error("cancel-booking error:", err);
    return json(500, { code: "INTERNAL", error: "Internal error" });
  }
});
