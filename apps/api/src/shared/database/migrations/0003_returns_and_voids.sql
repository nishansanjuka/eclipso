CREATE TYPE "public"."sale_status" AS ENUM('completed', 'voided');--> statement-breakpoint
ALTER TYPE "public"."movement_type_enum" ADD VALUE 'void';--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "status" "sale_status" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "voided_by" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "return_items_return_sale_item_uq" ON "return_items" USING btree ("return_id","sale_item_id");