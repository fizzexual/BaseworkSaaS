import { Activity, Bot, CreditCard, LayoutDashboard, Settings, Shield, Users } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  example?: boolean;
};

/** Primary dashboard navigation — shared by the sidebar and top-nav layouts. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Bot, example: true },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/usage", label: "Usage", icon: Activity },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const AdminIcon = Shield;

export interface DashboardNavProps {
  user: { name: string; email: string; image: string | null };
  activeOrg: { id: string; name: string; slug: string; plan: string };
  memberships: { id: string; name: string; slug: string; role: string }[];
  superAdmin: boolean;
}
