CREATE TYPE "public"."role_permission_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "role_permission_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"requested_permission_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"requested_by" text NOT NULL,
	"status" "role_permission_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_users" ADD COLUMN "is_banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "business_users" ADD COLUMN "banned_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_users" ADD COLUMN "banned_by" text;--> statement-breakpoint
ALTER TABLE "business_users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "protected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permission_requests" ADD CONSTRAINT "role_permission_requests_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission_requests" ADD CONSTRAINT "role_permission_requests_requested_by_users_clerk_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("clerk_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission_requests" ADD CONSTRAINT "role_permission_requests_reviewed_by_users_clerk_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("clerk_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_permission_requests_role_idx" ON "role_permission_requests" USING btree ("role_id","status");--> statement-breakpoint
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_banned_by_users_clerk_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."users"("clerk_id") ON DELETE set null ON UPDATE no action;