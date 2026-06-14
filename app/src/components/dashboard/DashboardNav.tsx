"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Key,
  BarChart2,
  ScrollText,
  Settings,
  BookOpen,
  CreditCard,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/keys", label: "API Keys", icon: Key },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/config", label: "Config", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white dark:bg-slate-900 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Copply</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Developer Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
    </aside>
  );
}
