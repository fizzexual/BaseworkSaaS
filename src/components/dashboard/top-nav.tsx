"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrandName } from "@/components/brand-provider";
import { AdminIcon, type DashboardNavProps, NAV_ITEMS } from "@/components/dashboard/nav-items";
import { OrgSwitcher } from "@/components/dashboard/org-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function TopNav({
  user,
  activeOrg,
  memberships,
  superAdmin,
  moduleStates,
}: DashboardNavProps) {
  const pathname = usePathname();
  const brandName = useBrandName();
  const items = NAV_ITEMS.filter((item) => !item.module || moduleStates[item.module]);

  const linkCls = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            B
          </span>
          <span className="hidden font-semibold tracking-tight lg:inline">{brandName}</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkCls(active)}>
                <Icon className="size-4" />
                {item.label}
                {item.example && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                    example
                  </span>
                )}
              </Link>
            );
          })}
          {superAdmin && (
            <Link href="/admin" className={linkCls(pathname.startsWith("/admin"))}>
              <AdminIcon className="size-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden w-44 md:block">
            <OrgSwitcher activeOrg={activeOrg} memberships={memberships} />
          </div>
          <ThemeToggle />
          <UserMenu user={user} compact />
        </div>
      </div>
    </header>
  );
}
