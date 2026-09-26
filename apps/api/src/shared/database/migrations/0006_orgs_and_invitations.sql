CREATE TYPE "public"."branch_kind" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role_id" uuid NOT NULL,
	"branch_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"token_hash" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"expires_at" timestamp NOT NULL,
	"last_sent_at" timestamp,
	"send_count" integer DEFAULT 0 NOT NULL,
	"accepted_at" timestamp,
	"accepted_by" text,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "kind" "branch_kind" DEFAULT 'store' NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "register_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
-- Existing businesses get a placeholder workspace address; owners can rename it.
ALTER TABLE "businesses" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "businesses" SET "slug" = 'org-' || substr(replace("id"::text, '-', ''), 1, 10);--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "registered_name" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "registration_number" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "country" text DEFAULT 'LK' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "address_line" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "vat_registered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "vat_number" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "currency" text DEFAULT 'LKR' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "rounding" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_clerk_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("clerk_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pending_email_uq" ON "invitations" USING btree ("business_id","email") WHERE "invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "invitations_business_idx" ON "invitations" USING btree ("business_id","status");--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_slug_unique" UNIQUE("slug");