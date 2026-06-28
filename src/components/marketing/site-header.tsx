import { Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_GITHUB_URL, APP_NAME, ROUTES } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: ROUTES.pricing },
  { label: "How it works", href: "/#how-it-works" },
];

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        {/* Logo */}
        <Link href={ROUTES.home} className="flex items-center gap-2.5">
          <span className="bg-brand inline-flex size-7 items-center justify-center rounded-lg shadow-lg shadow-primary/20">
            <span className="size-2.5 rounded-[3px] bg-white/90" />
          </span>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={APP_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span className="hidden lg:inline">GitHub</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground">
              <Star className="size-3.5 fill-warning text-warning" />
              Star
            </span>
          </a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href={ROUTES.signIn}>Sign in</Link>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link href={ROUTES.signUp}>Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
