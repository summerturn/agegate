import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function getAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function generateApiKey(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return "cp_" + Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: keys, error } = await admin
      .from("api_keys")
      .select("id, name, last_used_at, requests_today, requests_this_month, created_at")
      .eq("developer_id", session.user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      (keys || []).map((k) => ({
        id: k.id,
        name: k.name,
        key: "cp_••••••••",
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
        requestsToday: k.requests_today,
        requestsThisMonth: k.requests_this_month,
        permissions: ["verify-age"],
      }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    const rawKey = await generateApiKey();
    const keyHash = await hashKey(rawKey);

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("api_keys")
      .insert({
        developer_id: session.user.id,
        key_hash: keyHash,
        name: name.trim(),
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      key: rawKey,
      name: name.trim(),
      createdAt: data.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
