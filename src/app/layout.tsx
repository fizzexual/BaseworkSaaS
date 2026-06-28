import type { Metadata } from "next";
import { BrandProvider } from "@/components/brand-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { getPlatformSettings } from "@/lib/settings";
import "./globals.css";

// Appearance (brand, theme, accent) is read per-request from the DB, so every
// route under this layout renders dynamically instead of freezing settings at
// build time. Matches the dashboard/admin layouts, which are already dynamic.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — the complete SaaS template`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: `${APP_NAME} — the complete SaaS template`,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPlatformSettings();
  // Re-validate before interpolating into a <style> tag (defense-in-depth: the
  // writer already enforces this, but never trust stored data injected as CSS).
  const accent =
    settings.brandColor && /^#[0-9a-f]{6}$/i.test(settings.brandColor) ? settings.brandColor : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* Super-admin accent override — recolors primary actions + brand gradient
            start. Applied identically in light and dark (a single brand accent). */}
        {accent && (
          <style>{`:root{--primary:${accent}!important;--ring:${accent}!important;--brand-1:${accent}!important}`}</style>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme={settings.defaultTheme}
          enableSystem={settings.defaultTheme === "system"}
          disableTransitionOnChange
        >
          <BrandProvider name={settings.brandName ?? APP_NAME}>
            {children}
            <Toaster />
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
