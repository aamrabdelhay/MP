CREATE TYPE "public"."request_status" AS ENUM('new', 'old');--> statement-breakpoint
CREATE TYPE "public"."university_type" AS ENUM('government', 'private');--> statement-breakpoint
CREATE TABLE "admin_login_attempts" (
	"ip_hash" varchar(64) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"college" varchar(160) NOT NULL,
	"department" varchar(160),
	"phone" varchar(11) NOT NULL,
	"national_id" varchar(14) NOT NULL,
	"address" varchar(500) NOT NULL,
	"birth_date" date NOT NULL,
	"university_type" "university_type" NOT NULL,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "registration_requests_national_id_unique" ON "registration_requests" USING btree ("national_id");--> statement-breakpoint
CREATE INDEX "registration_requests_status_created_at_idx" ON "registration_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "registration_requests_phone_idx" ON "registration_requests" USING btree ("phone");