import { Star } from "lucide-react";
import Link from "next/link";
import { APP_GITHUB_URL, APP_NAME, ROUTES } from "@/lib/constants";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: ROUTES.pricing },
      { label: "Comparison", href: "/#comparison" },
      { label: "Get started", href: ROUTES.signUp },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "GitHub", href: APP_GITHUB_URL, external: true },
      { label: "Documentation", href: APP_GITHUB_URL, external: true },
      { label: "Self-hosting", href: APP_GITHUB_URL, external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign in", href: ROUTES.signIn },
      { label: "License (MIT)", href: APP_GITHUB_URL, external: true },
      { label: "Changelog", href: APP_GITHUB_URL, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href={ROUTES.home} className="flex items-center gap-2.5">
              <span className="bg-brand inline-flex size-7 items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                <span className="size-2.5 rounded-[3px] bg-white/90" />
              </span>
              <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The complete, multi-tenant SaaS template. You bring the product.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Built with {APP_NAME} · MIT License · © {new Date().getFullYear()}
          </p>
          <a
            href={APP_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Star className="size-4 fill-warning text-warning" />
            Star us on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
