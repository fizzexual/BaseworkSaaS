import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { getModuleStates } from "@/lib/flags";
import { getPlatformSettings } from "@/lib/settings";

export const metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  const [settings, moduleStates] = await Promise.all([getPlatformSettings(), getModuleStates()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform settings</h1>
        <p className="text-sm text-muted-foreground">
          Control how the app looks and which features are available. Changes apply for everyone, in
          real time.
        </p>
      </div>

      <PlatformSettingsForm
        appearance={{
          navLayout: settings.navLayout,
          defaultTheme: settings.defaultTheme,
          brandName: settings.brandName ?? "",
          brandColor: settings.brandColor ?? "",
        }}
        access={{
          signupsOpen: settings.signupsOpen,
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage ?? "",
        }}
        moduleStates={moduleStates}
      />
    </div>
  );
}
