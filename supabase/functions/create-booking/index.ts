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
    return json(405, { error: "Method not allowed" });
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
      return json(401, { error: "Authentication required" });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return json(400, { error: "Invalid JSON body" });
    }

    const { package_id, booking_date, participants, special_requests } = payload as {
      package_id?: string;
      booking_date?: string;
      participants?: number;
      special_requests?: string;
    };

    if (!package_id || typeof package_id !== "string") {
      return json(400, { error: "package_id is required" });
    }
    if (!booking_date || Number.isNaN(Date.parse(booking_date))) {
      return json(400, { error: "booking_date must be a valid date" });
    }
    if (!Number.isInteger(participants) || (participants as number) < 1) {
      return json(400, { error: "participants must be a positive integer" });
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
      return json(403, { error: "Only travelers can create bookings" });
    }

    // Load the package server-side — the client never supplies a price
    const { data: pkg, error: pkgError } = await adminClient
      .from("packages")
      .select("id, base_price, max_participants, status")
      .eq("id", package_id)
      .maybeSingle();
    if (pkgError || !pkg) {
      return json(404, { error: "Package not found" });
    }
    if (pkg.status !== "published") {
      return json(400, { error: "Package is not open for booking" });
    }
    if (pkg.max_participants != null && (participants as number) > pkg.max_participants) {
      return json(400, { error: `Maximum ${pkg.max_participants} participants for this package` });
    }

    const total_price = Number(pkg.base_price) * (participants as number);

    const { data: booking, error: insertError } = await adminClient
      .from("package_bookings")
      .insert({
        package_id,
        traveler_id: user.id,
        booking_date,
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
      return json(500, { error: "Failed to create booking" });
    }

    return json(201, { booking });
  } catch (err) {
    console.error("create-booking error:", err);
    return json(500, { error: "Internal error" });
  }
});
