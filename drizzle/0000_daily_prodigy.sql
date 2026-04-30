CREATE TABLE `daily_activity` (
	`user_id` text NOT NULL,
	`activity_date` text NOT NULL,
	`lessons_done` integer DEFAULT 0 NOT NULL,
	`quizzes_done` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `activity_date`)
);
--> statement-breakpoint
CREATE INDEX `activity_user_idx` ON `daily_activity` (`user_id`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`last_lesson` text,
	`last_accessed_at` integer,
	PRIMARY KEY(`user_id`, `course_id`)
);
--> statement-breakpoint
CREATE INDEX `enrollments_user_idx` ON `enrollments` (`user_id`);--> statement-breakpoint
CREATE TABLE `lesson_completions` (
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `course_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE INDEX `completions_user_idx` ON `lesson_completions` (`user_id`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`question_idx` integer NOT NULL,
	`selected` integer,
	`multi_selected` text,
	`matching` text,
	`submitted` integer DEFAULT false NOT NULL,
	`answered_at` integer,
	PRIMARY KEY(`user_id`, `course_id`, `lesson_id`, `question_idx`)
);
--> statement-breakpoint
CREATE INDEX `quiz_user_idx` ON `quiz_attempts` (`user_id`);