import { Wrench } from "lucide-react";

/** Full-page lock shown to non-admins while maintenance mode is on. */
export function MaintenanceScreen({ message }: { message?: string | null }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md space-y-5 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-primary/20">
          <Wrench className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">We'll be right back</h1>
          <p className="text-muted-foreground">
            {message?.trim() ||
              "The app is undergoing scheduled maintenance. Please check back shortly."}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Slim banner reminding a super-admin that maintenance mode is active. */
export function MaintenanceBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-warning">
      <Wrench className="size-4 shrink-0" />
      Maintenance mode is on — only admins can reach the app right now.
    </div>
  );
}
