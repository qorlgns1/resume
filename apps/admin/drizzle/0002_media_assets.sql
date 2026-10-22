CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`widths` text NOT NULL,
	`bytes` integer NOT NULL,
	`animated` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
