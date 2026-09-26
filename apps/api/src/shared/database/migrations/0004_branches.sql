CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "branches_default_is_active" CHECK (not "branches"."is_default" or "branches"."is_active")
);
--> statement-breakpoint
CREATE TABLE "member_branches" (
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	CONSTRAINT "member_branches_user_id_business_id_branch_id_pk" PRIMARY KEY("user_id","business_id","branch_id")
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_membership_fk" FOREIGN KEY ("user_id","business_id") REFERENCES "public"."business_users"("user_id","business_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branches_business_code_uq" ON "branches" USING btree ("business_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_one_default_uq" ON "branches" USING btree ("business_id") WHERE "branches"."is_default";--> statement-breakpoint
CREATE INDEX "member_branches_branch_idx" ON "member_branches" USING btree ("branch_id");--> statement-breakpoint
-- Every existing business gets its single default branch.
INSERT INTO "branches" ("business_id", "code", "name", "is_default") SELECT "id", 'MAIN', 'Main', true FROM "businesses";
