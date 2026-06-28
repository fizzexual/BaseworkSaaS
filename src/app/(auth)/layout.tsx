import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";

/**
 * Auth shell: a full-height, centered surface with the layered radial glow and
 * dotted-grid background used across the marketing site. Renders the Basework
 * logo (links home) above whichever auth card the route provides.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Background layers */}
      <div className="glow pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />

      <div className="flex w-full max-w-md flex-col items-center gap-8 animate-in-up">
        {/* Logo */}
        <Link href={ROUTES.home} className="flex items-center gap-2.5">
          <span className="bg-brand inline-flex size-7 items-center justify-center rounded-lg shadow-lg shadow-primary/20">
            <span className="size-2.5 rounded-[3px] bg-white/90" />
          </span>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        {children}
      </div>
    </main>
  );
}
