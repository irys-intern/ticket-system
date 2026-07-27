CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"site_icon_url" text DEFAULT '/favicon.svg' NOT NULL,
	"nlp_debounce_ms" integer DEFAULT 600 NOT NULL,
	"dashboard_cache_ttl_seconds" integer DEFAULT 60 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;