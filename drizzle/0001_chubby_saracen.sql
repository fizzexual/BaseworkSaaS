CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"nav_layout" text DEFAULT 'sidebar' NOT NULL,
	"default_theme" text DEFAULT 'light' NOT NULL,
	"brand_name" text,
	"brand_color" text,
	"signups_open" boolean DEFAULT true NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"maintenance_message" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
