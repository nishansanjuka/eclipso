CREATE TYPE "public"."business_type" AS ENUM('retail', 'service', 'manufacturing');--> statement-breakpoint
CREATE TYPE "public"."movement_type_enum" AS ENUM('purchase', 'sale', 'return', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'received', 'cancel', 'failed', 'return');--> statement-breakpoint
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
CREATE TABLE "categories" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"movement_type" "movement_type_enum" DEFAULT 'adjustment' NOT NULL,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" uuid NOT NULL,
	"total_tax" integer DEFAULT 0 NOT NULL,
	"total_discount" integer DEFAULT 0 NOT NULL,
	"sub_total" integer DEFAULT 0 NOT NULL,
	"grand_total" integer DEFAULT 0 NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_id_unique" UNIQUE("id"),
	CONSTRAINT "invoice_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"qty" integer DEFAULT 0 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"expire_date" timestamp NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_id_unique" UNIQUE("id")
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
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_business_id_businesses_org_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_categories_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_businesses_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_suppliers_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;