CREATE TABLE `interview_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`question` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "interview_notes_status" CHECK("interview_notes"."status" in ('todo', 'discussing', 'done'))
);
--> statement-breakpoint
CREATE INDEX `interview_notes_position_idx` ON `interview_notes` (`position`);