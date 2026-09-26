CREATE TABLE "branch_stock" (
	"branch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"qty" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "branch_stock_branch_id_product_id_pk" PRIMARY KEY("branch_id","product_id"),
	CONSTRAINT "branch_stock_qty_non_negative" CHECK ("branch_stock"."qty" >= 0)
);
--> statement-breakpoint
-- A business created between migration 0004 and this one may lack its default branch.
INSERT INTO "branches" ("business_id", "code", "name", "is_default")
SELECT b."id", 'MAIN', 'Main', true FROM "businesses" b
WHERE NOT EXISTS (SELECT 1 FROM "branches" x WHERE x."business_id" = b."id" AND x."is_default");
--> statement-breakpoint
-- Everything that already exists happened at the business's default branch.
ALTER TABLE "adjustments" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
UPDATE "adjustments" t SET "branch_id" = br."id" FROM "branches" br WHERE br."business_id" = t."business_id" AND br."is_default";--> statement-breakpoint
UPDATE "orders" t SET "branch_id" = br."id" FROM "branches" br WHERE br."business_id" = t."business_id" AND br."is_default";--> statement-breakpoint
UPDATE "sales" t SET "branch_id" = br."id" FROM "branches" br WHERE br."business_id" = t."business_id" AND br."is_default";--> statement-breakpoint
UPDATE "inventory_movements" t SET "branch_id" = br."id" FROM "products" p, "branches" br WHERE p."id" = t."product_id" AND br."business_id" = p."business_id" AND br."is_default";--> statement-breakpoint
-- Stock on hand moves from the product to the default branch.
INSERT INTO "branch_stock" ("branch_id", "product_id", "qty")
SELECT br."id", p."id", p."stock_qty" FROM "products" p
JOIN "branches" br ON br."business_id" = p."business_id" AND br."is_default"
WHERE p."stock_qty" > 0;--> statement-breakpoint
ALTER TABLE "adjustments" ALTER COLUMN "branch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "branch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "branch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "branch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branch_stock" ADD CONSTRAINT "branch_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_stock" ADD CONSTRAINT "branch_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branch_stock_product_idx" ON "branch_stock" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_stock_qty_non_negative";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock_qty";
