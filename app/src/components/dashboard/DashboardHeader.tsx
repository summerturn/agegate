"use client";

import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { LogOut } from "lucide-react";

export function DashboardHeader({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b bg-white dark:bg-slate-900 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
