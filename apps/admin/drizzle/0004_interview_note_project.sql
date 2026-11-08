ALTER TABLE `interview_notes` ADD `project_id` text;--> statement-breakpoint
CREATE INDEX `interview_notes_project_idx` ON `interview_notes` (`project_id`);