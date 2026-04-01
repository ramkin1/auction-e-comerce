CREATE TABLE `adminSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `moderation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('item','document','user_report') NOT NULL,
	`targetId` int NOT NULL,
	`reason` text NOT NULL,
	`reportedBy` int,
	`status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moderation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` enum('false','true') DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `banReason` text;