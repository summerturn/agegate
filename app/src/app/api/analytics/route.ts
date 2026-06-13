import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { subDays, format, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const days = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const since = subDays(new Date(), days).toISOString();

    const admin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: verifications } = await admin
      .from("verification_requests")
      .select("result, declared_age, created_at, detected_state")
      .eq("developer_id", session.user.id)
      .gte("created_at", since)
      .is("deleted_at", null);

    const rows = verifications || [];
    const total = rows.length;
    const allowed = rows.filter((r) => r.result === "allowed").length;
    const successRate = total > 0 ? (allowed / total) * 100 : 0;

    const ages = rows.filter((r) => r.declared_age).map((r) => r.declared_age as number);
    const averageAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    // Daily stats
    const dailyMap: Record<string, { verifications: number; successes: number; failures: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "MMM d");
      dailyMap[date] = { verifications: 0, successes: 0, failures: 0 };
    }
    for (const row of rows) {
      const date = format(new Date(row.created_at), "MMM d");
      if (dailyMap[date]) {
        dailyMap[date].verifications++;
        if (row.result === "allowed") dailyMap[date].successes++;
        else dailyMap[date].failures++;
      }
    }

    // Age distribution
    const ageBuckets: Record<string, number> = {
      "Under 13": 0, "13-17": 0, "18-24": 0, "25-34": 0, "35+": 0,
    };
    for (const age of ages) {
      if (age < 13) ageBuckets["Under 13"]++;
      else if (age < 18) ageBuckets["13-17"]++;
      else if (age < 25) ageBuckets["18-24"]++;
      else if (age < 35) ageBuckets["25-34"]++;
      else ageBuckets["35+"]++;
    }

    return NextResponse.json({
      totalVerifications: total,
      successRate,
      averageAge,
      dailyStats: Object.entries(dailyMap).map(([date, stats]) => ({ date, ...stats })),
      methodBreakdown: [
        { method: "API", count: total, percentage: 100 },
      ],
      ageDistribution: Object.entries(ageBuckets).map(([ageRange, count]) => ({ ageRange, count })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
