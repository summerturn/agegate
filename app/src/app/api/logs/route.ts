import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rows } = await admin
      .from("verification_requests")
      .select("id, result, declared_age, detected_state, device_platform, reason, created_at, user_id_hash")
      .eq("developer_id", session.user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);

    return NextResponse.json(
      (rows || []).map((r) => ({
        id: r.id,
        timestamp: r.created_at,
        event: "age-verification",
        userId: r.user_id_hash.slice(0, 8) + "…",
        status: r.result === "allowed" ? "success" : r.result === "pending_consent" ? "warning" : "failure",
        details: r.reason || `State: ${r.detected_state}, Age: ${r.declared_age ?? "unknown"}`,
        ip: "—",
        userAgent: r.device_platform || "unknown",
      }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
