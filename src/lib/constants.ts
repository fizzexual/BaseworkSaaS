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
