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

    const { data: dev } = await admin
      .from("developers")
      .select("plan_tier, stripe_subscription_id, mau_limit, mau_current")
      .eq("id", session.user.id)
      .single();

    if (!dev) return NextResponse.json(null);

    return NextResponse.json({
      plan: dev.plan_tier,
      stripeSubscriptionId: dev.stripe_subscription_id,
      mauLimit: dev.mau_limit,
      mauCurrent: dev.mau_current,
      status: dev.stripe_subscription_id ? "active" : "free",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
