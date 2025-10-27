CREATE TYPE "public"."business_type" AS ENUM('retail', 'service', 'manufacturing');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"org_id" text NOT NULL,
	"business_type" "business_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_id_unique" UNIQUE("id"),
	CONSTRAINT "businesses_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "business_users" (
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	CONSTRAINT "business_users_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_user_id_users_clerk_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_business_id_businesses_org_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("org_id") ON DELETE cascade ON UPDATE no action;