"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MODULE_LABELS, MODULES, type ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";
import {
  adminToggleModule,
  adminUpdateAccess,
  adminUpdateAppearance,
} from "@/server/actions/admin";

const DEFAULT_ACCENT = "#5b47fb";

interface Props {
  appearance: {
    navLayout: "sidebar" | "topnav";
    defaultTheme: "light" | "dark" | "system";
    brandName: string;
    brandColor: string;
  };
  access: { signupsOpen: boolean; maintenanceMode: boolean; maintenanceMessage: string };
  moduleStates: Record<ModuleKey, boolean>;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function PlatformSettingsForm({ appearance, access, moduleStates }: Props) {
  const [pending, start] = useTransition();

  const [navLayout, setNavLayout] = useState(appearance.navLayout);
  const [defaultTheme, setDefaultTheme] = useState(appearance.defaultTheme);
  const [brandName, setBrandName] = useState(appearance.brandName);
  const [brandColor, setBrandColor] = useState(appearance.brandColor);

  const [modules, setModules] = useState(moduleStates);

  const [signupsOpen, setSignupsOpen] = useState(access.signupsOpen);
  const [maintenanceMode, setMaintenanceMode] = useState(access.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(access.maintenanceMessage);

  function saveAppearance() {
    start(async () => {
      try {
        await adminUpdateAppearance({ navLayout, defaultTheme, brandName, brandColor });
        toast.success("Appearance saved");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function toggleModule(m: ModuleKey, next: boolean) {
    setModules((s) => ({ ...s, [m]: next }));
    start(async () => {
      try {
        await adminToggleModule(m, next);
        toast.success(`${MODULE_LABELS[m]} ${next ? "enabled" : "disabled"}`);
      } catch (e) {
        setModules((s) => ({ ...s, [m]: !next }));
        toast.error((e as Error).message);
      }
    });
  }

  function saveAccess(next: {
    signupsOpen: boolean;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  }) {
    start(async () => {
      try {
        await adminUpdateAccess(next);
        toast.success("Access settings saved");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field label="Navigation layout" hint="A left sidebar rail or a horizontal top bar.">
            <Segmented
              value={navLayout}
              disabled={pending}
              onChange={setNavLayout}
              options={[
                { value: "sidebar", label: "Sidebar" },
                { value: "topnav", label: "Top bar" },
              ]}
            />
          </Field>
          <Field label="Default theme" hint="Applied to new visitors; users can still switch.">
            <Segmented
              value={defaultTheme}
              disabled={pending}
              onChange={setDefaultTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
            />
          </Field>
          <Field label="Brand name" hint="Shown in the sidebar, top bar, and marketing header.">
            <Input
              value={brandName}
              maxLength={40}
              placeholder="Basework"
              disabled={pending}
              onChange={(e) => setBrandName(e.target.value)}
              className="max-w-xs"
            />
          </Field>
          <Field label="Accent color" hint="Recolors primary actions and the brand mark.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor || DEFAULT_ACCENT}
                disabled={pending}
                onChange={(e) => setBrandColor(e.target.value)}
                aria-label="Accent color"
                className="size-9 cursor-pointer rounded-md border border-border bg-transparent"
              />
              <Input
                value={brandColor}
                placeholder={DEFAULT_ACCENT}
                disabled={pending}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-32 font-mono"
              />
              {brandColor && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setBrandColor("")}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reset
                </button>
              )}
            </div>
          </Field>
          <Button variant="brand" onClick={saveAppearance} disabled={pending}>
            Save appearance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature modules</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {MODULES.map((m) => (
            <div key={m} className="flex items-center gap-3 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{MODULE_LABELS[m]}</p>
                <p className="text-xs text-muted-foreground">
                  {modules[m]
                    ? "Visible in the nav and reachable."
                    : "Hidden from the nav; its routes redirect."}
                </p>
              </div>
              <Switch
                checked={modules[m]}
                disabled={pending}
                onCheckedChange={(v) => toggleModule(m, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Open sign-ups</p>
              <p className="text-xs text-muted-foreground">
                When off, the app is invite-only — only invited emails can register.
              </p>
            </div>
            <Switch
              checked={signupsOpen}
              disabled={pending}
              onCheckedChange={(v) => {
                setSignupsOpen(v);
                saveAccess({ signupsOpen: v, maintenanceMode, maintenanceMessage });
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Maintenance mode</p>
              <p className="text-xs text-muted-foreground">
                Locks the app for everyone except admins.
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              disabled={pending}
              onCheckedChange={(v) => {
                setMaintenanceMode(v);
                saveAccess({ signupsOpen, maintenanceMode: v, maintenanceMessage });
              }}
            />
          </div>
          <Field label="Maintenance message" hint="Shown on the lock screen (optional).">
            <div className="flex items-center gap-3">
              <Input
                value={maintenanceMessage}
                maxLength={200}
                placeholder="We'll be right back…"
                disabled={pending}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="max-w-md"
              />
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => saveAccess({ signupsOpen, maintenanceMode, maintenanceMessage })}
              >
                Save
              </Button>
            </div>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
