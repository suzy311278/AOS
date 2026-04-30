CREATE TABLE `llm_usage` (
	`feature` text NOT NULL,
	`subject` text NOT NULL,
	`period_key` text NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`feature`, `subject`, `period_key`)
);
--> statement-breakpoint
CREATE INDEX `llm_usage_subject_idx` ON `llm_usage` (`subject`);