export const APP_NAME = "Basework";
export const APP_DESCRIPTION =
  "The complete, multi-tenant SaaS template. Auth, teams & RBAC, Stripe billing, usage metering, an admin panel, jobs and more — every functionality your product needs, so you just build the product.";
export const APP_TAGLINE = "Everything your SaaS needs, except the product.";
export const APP_GITHUB_URL = "https://github.com/fizzexual/BaseworkSaaS";

/** Routes used across the app shell. */
export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  signIn: "/sign-in",
  signUp: "/sign-up",
  dashboard: "/dashboard",
  ai: "/dashboard/ai",
  billing: "/dashboard/billing",
  members: "/dashboard/members",
  usage: "/dashboard/usage",
  settings: "/dashboard/settings",
  admin: "/admin",
} as const;

/**
 * Dashboard navigation layout. "sidebar" (default) renders a fixed left rail;
 * "topnav" renders a horizontal top bar with full-width content. Flip without
 * touching code via the NEXT_PUBLIC_NAV_LAYOUT build env var.
 */
export const NAV_LAYOUT: "sidebar" | "topnav" =
  process.env.NEXT_PUBLIC_NAV_LAYOUT === "topnav" ? "topnav" : "sidebar";
