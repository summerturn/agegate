import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard | AgeGate",
  description: "AgeGate dashboard overview",
};

async function getDashboardStats() {
  const supabase = createClient();

  const { data: verifications } = await supabase
    .from("verifications")
    .select("status", { count: "exact" });

  const { data: recentVerifications } = await supabase
    .from("verifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("*", { count: "exact" });

  return {
    totalVerifications: verifications?.length || 0,
    recentVerifications: recentVerifications || [],
    totalApiKeys: apiKeys?.length || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AgeGate dashboard. Here is an overview of your activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVerifications.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApiKeys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
          <CardDescription>Latest age verification attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentVerifications.length > 0 ? (
              stats.recentVerifications.map((verification: any) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-semibold">{verification.method || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {verification.status} - {verification.age} years old
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(verification.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No verifications yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
