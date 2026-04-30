CREATE TABLE `sustainiq_queries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`query` text NOT NULL,
	`answer` text NOT NULL,
	`sources` text,
	`lessons` text,
	`model` text,
	`revise_count` integer DEFAULT 0,
	`latency_ms` integer,
	`tokens_in` integer,
	`tokens_out` integer,
	`tier` text,
	`status` text DEFAULT 'success' NOT NULL,
	`error_message` text,
	`feedback` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sustainiq_user_idx` ON `sustainiq_queries` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `sustainiq_created_idx` ON `sustainiq_queries` (`created_at`);