import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    if (!payload) {
      return json(400, { code: "INVALID_BODY", error: "Invalid JSON body" });
    }

    const { booking_id, rating, comment } = payload as {
      booking_id?: string;
      rating?: number;
      comment?: string;
    };

    if (!booking_id || typeof booking_id !== "string") {
      return json(400, { code: "INVALID_BODY", error: "booking_id is required" });
    }
    if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
      return json(400, { code: "INVALID_RATING", error: "rating must be an integer between 1 and 5" });
    }

    // Service-role client: trusted reads/writes independent of RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // The booking must belong to the caller and be completed.
    // package_id is derived from the booking — never taken from the client.
    const { data: booking, error: bookingError } = await adminClient
      .from("package_bookings")
      .select("id, traveler_id, package_id, status")
      .eq("id", booking_id)
      .maybeSingle();
    if (bookingError || !booking) {
      return json(404, { code: "BOOKING_NOT_FOUND", error: "Booking not found" });
    }
    if (booking.traveler_id !== user.id) {
      return json(403, { code: "NOT_YOUR_BOOKING", error: "You can only review your own bookings" });
    }
    if (booking.status !== "completed") {
      return json(400, { code: "TRIP_NOT_COMPLETED", error: "You can only review completed trips" });
    }

    const { data: review, error: insertError } = await adminClient
      .from("reviews")
      .insert({
        traveler_id: user.id,
        package_id: booking.package_id,
        booking_id: booking.id,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return json(409, { code: "ALREADY_REVIEWED", error: "You have already reviewed this booking" });
      }
      console.error("Review insert failed:", insertError);
      return json(500, { code: "REVIEW_FAILED", error: "Failed to submit review" });
    }

    return json(201, { review });
  } catch (err) {
    console.error("create-review error:", err);
    return json(500, { code: "INTERNAL", error: "Internal error" });
  }
});
