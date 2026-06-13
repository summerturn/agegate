import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Stripe from "stripe";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dev } = await admin
      .from("developers")
      .select("stripe_subscription_id")
      .eq("id", session.user.id)
      .single();

    if (!dev?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
    await stripe.subscriptions.update(dev.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
