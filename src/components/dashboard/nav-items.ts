import { Activity, Bot, CreditCard, LayoutDashboard, Settings, Shield, Users } from "lucide-react";
import type { ModuleKey } from "@/lib/modules";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  example?: boolean;
  /** When set, the item is hidden unless this feature module is enabled. */
  module?: ModuleKey;
};

/** Primary dashboard navigation — shared by the sidebar and top-nav layouts. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Bot, example: true, module: "ai" },
  { href: "/dashboard/members", label: "Members", icon: Users, module: "members" },
  { href: "/dashboard/usage", label: "Usage", icon: Activity, module: "usage" },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, module: "billing" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const AdminIcon = Shield;

export interface DashboardNavProps {
  user: { name: string; email: string; image: string | null };
  activeOrg: { id: string; name: string; slug: string; plan: string };
  memberships: { id: string; name: string; slug: string; role: string }[];
  superAdmin: boolean;
  /** Which feature modules are enabled (filters the nav). */
  moduleStates: Record<ModuleKey, boolean>;
}
