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

    const { package_id, booking_date, participants, special_requests, departure_id } = payload as {
      package_id?: string;
      booking_date?: string;
      participants?: number;
      special_requests?: string;
      departure_id?: string;
    };

    if (!package_id || typeof package_id !== "string") {
      return json(400, { code: "INVALID_BODY", error: "package_id is required" });
    }
    // When a departure is chosen the date comes from it (validated below);
    // otherwise the client must supply a valid date.
    if (!departure_id && (!booking_date || Number.isNaN(Date.parse(booking_date)))) {
      return json(400, { code: "INVALID_DATE", error: "booking_date must be a valid date" });
    }
    if (!Number.isInteger(participants) || (participants as number) < 1) {
      return json(400, { code: "INVALID_PARTICIPANTS", error: "participants must be a positive integer" });
    }

    // Service-role client: trusted reads/writes independent of RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Caller must be a traveler (FK also enforces this)
    const { data: traveler } = await adminClient
      .from("travelers")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!traveler) {
      return json(403, { code: "TRAVELERS_ONLY", error: "Only travelers can create bookings" });
    }

    // Load the package server-side — the client never supplies a price
    const { data: pkg, error: pkgError } = await adminClient
      .from("packages")
      .select("id, base_price, max_participants, status")
      .eq("id", package_id)
      .maybeSingle();
    if (pkgError || !pkg) {
      return json(404, { code: "PKG_NOT_FOUND", error: "Package not found" });
    }
    if (pkg.status !== "published") {
      return json(400, { code: "PKG_NOT_BOOKABLE", error: "Package is not open for booking" });
    }
    if (pkg.max_participants != null && (participants as number) > pkg.max_participants) {
      return json(400, { code: "MAX_PARTICIPANTS", max: pkg.max_participants, error: `Maximum ${pkg.max_participants} participants for this package` });
    }

    // If a departure is chosen, the booking date and unit price come from it
    // (server-authoritative), and the booking is linked to that departure.
    let effectiveBookingDate = booking_date as string;
    let unitPrice = Number(pkg.base_price);
    let departureId: string | null = null;

    if (departure_id) {
      const { data: dep } = await adminClient
        .from("package_departures")
        .select("id, package_id, departure_date, price_override, status")
        .eq("id", departure_id)
        .maybeSingle();
      if (!dep || dep.package_id !== package_id) {
        return json(400, { code: "INVALID_DEPARTURE", error: "Departure not found for this package" });
      }
      if (dep.status !== "scheduled") {
        return json(400, { code: "DEPARTURE_NOT_BOOKABLE", error: "This departure is not open for booking" });
      }
      effectiveBookingDate = dep.departure_date as string;
      if (dep.price_override != null) unitPrice = Number(dep.price_override);
      departureId = dep.id as string;
    }

    const total_price = unitPrice * (participants as number);

    const { data: booking, error: insertError } = await adminClient
      .from("package_bookings")
      .insert({
        package_id,
        traveler_id: user.id,
        booking_date: effectiveBookingDate,
        departure_id: departureId,
        participants,
        total_price,
        special_requests: special_requests || null,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Booking insert failed:", insertError);
      // The capacity trigger raises a check_violation when seats are exhausted.
      if (insertError.code === "23514" || (insertError.message || "").includes("capacity")) {
        return json(409, { code: "DEPARTURE_FULL", error: "Not enough seats remaining for this departure" });
      }
      return json(500, { code: "BOOKING_FAILED", error: "Failed to create booking" });
    }

    return json(201, { booking });
  } catch (err) {
    console.error("create-booking error:", err);
    return json(500, { code: "INTERNAL", error: "Internal error" });
  }
});
