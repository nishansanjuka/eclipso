CREATE TABLE "business_protected_permissions" (
	"business_id" text NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "business_protected_permissions_business_id_permission_id_pk" PRIMARY KEY("business_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "business_protected_permissions" ADD CONSTRAINT "business_protected_permissions_business_id_businesses_org_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_protected_permissions" ADD CONSTRAINT "business_protected_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_protected_permissions_permission_idx" ON "business_protected_permissions" USING btree ("permission_id");--> statement-breakpoint
ALTER TABLE "permissions" DROP COLUMN "protected";