"use client";

import { Activity, Bot, CreditCard, LayoutDashboard, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrgSwitcher } from "@/components/dashboard/org-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  example?: boolean;
}[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Bot, example: true },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/usage", label: "Usage", icon: Activity },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: { name: string; email: string; image: string | null };
  activeOrg: { id: string; name: string; slug: string; plan: string };
  memberships: { id: string; name: string; slug: string; role: string }[];
  superAdmin: boolean;
}

export function Sidebar({ user, activeOrg, memberships, superAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/60 backdrop-blur md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            B
          </span>
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
      </div>

      <div className="border-b border-border p-3">
        <OrgSwitcher activeOrg={activeOrg} memberships={memberships} />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {item.example && (
                <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                  example
                </span>
              )}
            </Link>
          );
        })}

        {superAdmin && (
          <Link
            href="/admin"
            className={cn(
              "mt-2 flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Shield className="size-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
