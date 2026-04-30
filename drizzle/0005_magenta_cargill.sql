CREATE TABLE `usage_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`metadata` text,
	`ts` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `usage_user_ts_idx` ON `usage_events` (`user_id`,`ts`);--> statement-breakpoint
CREATE INDEX `usage_kind_ts_idx` ON `usage_events` (`kind`,`ts`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`tools_enabled` text DEFAULT '{}' NOT NULL,
	`notification_prefs` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
