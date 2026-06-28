export const APP_NAME = "Basework";
export const APP_DESCRIPTION =
  "The advanced, AI-native, multi-tenant SaaS starter. Auth, orgs & RBAC, Stripe billing, AI credit metering, and an admin panel — runs zero-config.";
export const APP_TAGLINE = "Ship your SaaS this weekend, not next quarter.";
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
