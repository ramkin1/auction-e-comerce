CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`bidAmount` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`uploaderId` int NOT NULL,
	`docType` enum('certificate_of_authenticity','appraisal','provenance','other') NOT NULL DEFAULT 'other',
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('artwork','antique','jewelry','furniture','collectible','other') NOT NULL DEFAULT 'other',
	`startingPrice` decimal(12,2) NOT NULL,
	`currentPrice` decimal(12,2) NOT NULL,
	`imageUrl` text,
	`endTime` bigint NOT NULL,
	`status` enum('active','ended','sold','cancelled') NOT NULL DEFAULT 'active',
	`bidCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`mpesaCode` varchar(64),
	`checkoutRequestId` varchar(128),
	`merchantRequestId` varchar(128),
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`resultDesc` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`)
);
