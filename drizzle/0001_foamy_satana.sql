CREATE TABLE `ef_cite_list_items` (
	`cite_list_id` text NOT NULL,
	`factor_id` text NOT NULL,
	`added_at` integer NOT NULL,
	`note` text,
	PRIMARY KEY(`cite_list_id`, `factor_id`)
);
--> statement-breakpoint
CREATE INDEX `ef_cite_list_items_list_idx` ON `ef_cite_list_items` (`cite_list_id`);--> statement-breakpoint
CREATE TABLE `ef_cite_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ef_cite_lists_user_idx` ON `ef_cite_lists` (`user_id`);--> statement-breakpoint
CREATE TABLE `ef_issue_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`factor_id` text NOT NULL,
	`submitted_at` integer NOT NULL,
	`reporter_email` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`editor_note` text,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE INDEX `ef_issues_factor_idx` ON `ef_issue_reports` (`factor_id`);--> statement-breakpoint
CREATE INDEX `ef_issues_status_idx` ON `ef_issue_reports` (`status`);--> statement-breakpoint
CREATE TABLE `ef_saved_factors` (
	`user_id` text NOT NULL,
	`factor_id` text NOT NULL,
	`saved_at` integer NOT NULL,
	`folder` text,
	PRIMARY KEY(`user_id`, `factor_id`)
);
--> statement-breakpoint
CREATE INDEX `ef_saved_user_idx` ON `ef_saved_factors` (`user_id`);--> statement-breakpoint
CREATE TABLE `ef_search_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`query` text NOT NULL,
	`searched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ef_search_user_idx` ON `ef_search_history` (`user_id`);--> statement-breakpoint
CREATE TABLE `feedback_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`page_url` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`handled_at` integer
);
--> statement-breakpoint
CREATE INDEX `feedback_created_idx` ON `feedback_submissions` (`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_type_idx` ON `feedback_submissions` (`type`);--> statement-breakpoint
CREATE TABLE `service_enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`role` text,
	`engagement` text NOT NULL,
	`timeline` text NOT NULL,
	`budget` text,
	`message` text NOT NULL,
	`user_id` text,
	`page_url` text,
	`user_agent` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`handled_at` integer
);
--> statement-breakpoint
CREATE INDEX `enquiry_created_idx` ON `service_enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiry_status_idx` ON `service_enquiries` (`status`);--> statement-breakpoint
CREATE INDEX `enquiry_engagement_idx` ON `service_enquiries` (`engagement`);