CREATE TABLE `user_resumes` (
	`user_id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_r2_key` text NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`extracted_text` text,
	`embedding` text,
	`profile` text,
	`error` text,
	`uploaded_at` integer NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
CREATE INDEX `resumes_uploaded_idx` ON `user_resumes` (`uploaded_at`);