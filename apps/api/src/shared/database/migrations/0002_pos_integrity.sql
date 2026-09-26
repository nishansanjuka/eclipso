ALTER TABLE "adjustments" DROP CONSTRAINT "adjustments_user_id_users_clerk_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_users_clerk_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_org_id_businesses_org_id_fk";
--> statement-breakpoint
ALTER TABLE "discount" DROP CONSTRAINT "discount_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_brand_id_brand_id_fk";
--> statement-breakpoint
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "returns" DROP CONSTRAINT "returns_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "tax" DROP CONSTRAINT "tax_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "adjustments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "sale_seq" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "receipt_number" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "sub_total" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "total_discount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "total_tax" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_user_id_users_clerk_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_clerk_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_businesses_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."businesses"("org_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax" ADD CONSTRAINT "tax_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_business_receipt_uq" ON "sales" USING btree ("business_id","receipt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_business_idempotency_uq" ON "sales" USING btree ("business_id","idempotency_key");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_qty_non_negative" CHECK ("products"."stock_qty" >= 0) NOT VALID;--> statement-breakpoint
-- NOT VALID: enforced for every new/updated row, without failing on any negative stock already in the table.
-- After correcting such rows run: ALTER TABLE "products" VALIDATE CONSTRAINT "products_stock_qty_non_negative";