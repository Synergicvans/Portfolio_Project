CREATE TABLE `answers` (
	`key` text PRIMARY KEY NOT NULL,
	`answer` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `answers_expires_idx` ON `answers` (`expires`);--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expires_idx` ON `limits` (`expires`);--> statement-breakpoint
CREATE TABLE `locks` (
	`key` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL
);
