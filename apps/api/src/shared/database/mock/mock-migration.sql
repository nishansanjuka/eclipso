
--> statement-breakpoint

-- Insert Suppliers
INSERT INTO "suppliers" ("business_id", "name", "contact", "description", "created_at", "updated_at") VALUES
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Fresh Foods Wholesale', '+1-555-0101', 'Premium fresh produce supplier', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Dairy Distributors Inc', '+1-555-0102', 'Dairy and refrigerated products', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Snack Masters Ltd', '+1-555-0103', 'Packaged snacks and beverages', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Bakery Goods Co', '+1-555-0104', 'Bread and baked goods supplier', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Beverage Solutions', '+1-555-0105', 'Soft drinks and juices', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Frozen Foods Direct', '+1-555-0106', 'Frozen meals and ice cream', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Canned Goods Warehouse', '+1-555-0107', 'Canned and preserved foods', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Meat Market Supply', '+1-555-0108', 'Fresh and frozen meats', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Health Foods Group', '+1-555-0109', 'Organic and health products', now(), now()),
('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Household Essentials', '+1-555-0110', 'Cleaning and household items', now(), now());

--> statement-breakpoint

-- Insert Categories (parent categories first, then child categories)
WITH parent_cats AS (
  INSERT INTO "categories" ("business_id", "name", "parent_id", "created_at", "updated_at") VALUES
  ('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Food & Beverages', NULL, now(), now()),
  ('07ed003d-9a1f-44f0-bcf5-6c29ecb248c4', 'Household Items', NULL, now(), now())
  RETURNING id, name
)
INSERT INTO "categories" ("business_id", "name", "parent_id", "created_at", "updated_at")
SELECT 
  '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4',
  category_name,
  (SELECT id FROM parent_cats WHERE name = parent_name),
  now(),
  now()
FROM (VALUES
  ('Dairy Products', 'Food & Beverages'),
  ('Snacks', 'Food & Beverages'),
  ('Beverages', 'Food & Beverages'),
  ('Fresh Produce', 'Food & Beverages'),
  ('Frozen Foods', 'Food & Beverages'),
  ('Bakery', 'Food & Beverages'),
  ('Cleaning Supplies', 'Household Items'),
  ('Personal Care', 'Household Items')
) AS child_cats(category_name, parent_name);

--> statement-breakpoint

-- Insert Products
INSERT INTO "products" ("business_id", "supplier_id", "name", "sku", "price", "stock_qty", "metadata", "created_at", "updated_at")
SELECT 
  '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4',
  s.id,
  p.name,
  p.sku,
  p.price,
  p.stock_qty,
  p.metadata::jsonb,
  now(),
  now()
FROM (
  SELECT 'Dairy Distributors Inc' as supplier_name, 'Whole Milk 1L' as name, 'SKU-MILK-001' as sku, 299 as price, 150 as stock_qty, '{"brand": "Fresh Dairy", "expiry_days": 7}' as metadata
  UNION ALL SELECT 'Dairy Distributors Inc', 'Greek Yogurt 500g', 'SKU-YOGURT-001', 499, 100, '{"brand": "Healthy Choice", "expiry_days": 14}'
  UNION ALL SELECT 'Snack Masters Ltd', 'Potato Chips 200g', 'SKU-CHIPS-001', 349, 200, '{"brand": "Crispy Snacks", "flavor": "Original"}'
  UNION ALL SELECT 'Snack Masters Ltd', 'Chocolate Bar 100g', 'SKU-CHOC-001', 199, 300, '{"brand": "Sweet Treats", "type": "Milk Chocolate"}'
  UNION ALL SELECT 'Beverage Solutions', 'Orange Juice 1L', 'SKU-JUICE-001', 399, 120, '{"brand": "Fresh Squeeze", "type": "100% Pure"}'
  UNION ALL SELECT 'Beverage Solutions', 'Cola 2L', 'SKU-SODA-001', 249, 250, '{"brand": "Fizzy Pop", "calories": 200}'
  UNION ALL SELECT 'Fresh Foods Wholesale', 'Fresh Apples 1kg', 'SKU-APPLE-001', 449, 80, '{"origin": "Local Farm", "organic": true}'
  UNION ALL SELECT 'Fresh Foods Wholesale', 'Bananas 1kg', 'SKU-BANANA-001', 299, 100, '{"origin": "Tropical Farms", "ripeness": "Yellow"}'
  UNION ALL SELECT 'Bakery Goods Co', 'White Bread Loaf', 'SKU-BREAD-001', 279, 150, '{"brand": "Daily Bakery", "sliced": true}'
  UNION ALL SELECT 'Frozen Foods Direct', 'Vanilla Ice Cream 1L', 'SKU-ICE-001', 599, 75, '{"brand": "Cold Delights", "flavor": "French Vanilla"}'
) p
INNER JOIN "suppliers" s ON s.name = p.supplier_name AND s.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4';

--> statement-breakpoint

-- Insert Product Categories (many-to-many relationships) - IMPORTANT!!!
INSERT INTO "product_categories" ("product_id", "category_id")
SELECT 
  p.id,
  c.id
FROM (
  SELECT 'Whole Milk 1L' as product_name, 'Dairy Products' as category_name
  UNION ALL SELECT 'Whole Milk 1L', 'Food & Beverages'
  UNION ALL SELECT 'Greek Yogurt 500g', 'Dairy Products'
  UNION ALL SELECT 'Greek Yogurt 500g', 'Food & Beverages'
  UNION ALL SELECT 'Potato Chips 200g', 'Snacks'
  UNION ALL SELECT 'Potato Chips 200g', 'Food & Beverages'
  UNION ALL SELECT 'Chocolate Bar 100g', 'Snacks'
  UNION ALL SELECT 'Chocolate Bar 100g', 'Food & Beverages'
  UNION ALL SELECT 'Orange Juice 1L', 'Beverages'
  UNION ALL SELECT 'Orange Juice 1L', 'Fresh Produce'
  UNION ALL SELECT 'Orange Juice 1L', 'Food & Beverages'
  UNION ALL SELECT 'Cola 2L', 'Beverages'
  UNION ALL SELECT 'Cola 2L', 'Food & Beverages'
  UNION ALL SELECT 'Fresh Apples 1kg', 'Fresh Produce'
  UNION ALL SELECT 'Fresh Apples 1kg', 'Food & Beverages'
  UNION ALL SELECT 'Bananas 1kg', 'Fresh Produce'
  UNION ALL SELECT 'Bananas 1kg', 'Food & Beverages'
  UNION ALL SELECT 'White Bread Loaf', 'Bakery'
  UNION ALL SELECT 'White Bread Loaf', 'Food & Beverages'
  UNION ALL SELECT 'Vanilla Ice Cream 1L', 'Frozen Foods'
  UNION ALL SELECT 'Vanilla Ice Cream 1L', 'Food & Beverages'
) pc
INNER JOIN "products" p ON p.name = pc.product_name AND p.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4'
INNER JOIN "categories" c ON c.name = pc.category_name AND c.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4';

--> statement-breakpoint

-- Insert Invoices
INSERT INTO "invoice" ("total_tax", "total_discount", "sub_total", "grand_total", "pdf_url", "created_at", "updated_at") VALUES
(150, 50, 1000, 1100, NULL, now(), now()),
(200, 100, 1500, 1600, NULL, now(), now()),
(100, 25, 800, 875, NULL, now(), now()),
(250, 150, 2000, 2100, NULL, now(), now()),
(180, 80, 1200, 1300, NULL, now(), now()),
(120, 60, 900, 960, NULL, now(), now()),
(300, 200, 2500, 2600, NULL, now(), now()),
(90, 40, 700, 750, NULL, now(), now()),
(220, 120, 1800, 1900, NULL, now(), now()),
(160, 70, 1100, 1190, NULL, now(), now());

--> statement-breakpoint

-- Insert Orders
INSERT INTO "orders" ("business_id", "supplier_id", "invoice_id", "expire_date", "status", "total_amount", "created_at", "updated_at")
SELECT 
  '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4',
  s.id,
  i.id,
  now() + interval '30 days',
  o.status::order_status,
  o.total_amount,
  now(),
  now()
FROM (
  SELECT 'Dairy Distributors Inc' as supplier_name, 'received' as status, 1100 as total_amount, 1 as invoice_num
  UNION ALL SELECT 'Snack Masters Ltd', 'received', 1600, 2
  UNION ALL SELECT 'Beverage Solutions', 'draft', 875, 3
  UNION ALL SELECT 'Fresh Foods Wholesale', 'received', 2100, 4
  UNION ALL SELECT 'Bakery Goods Co', 'received', 1300, 5
  UNION ALL SELECT 'Frozen Foods Direct', 'draft', 960, 6
  UNION ALL SELECT 'Canned Goods Warehouse', 'received', 2600, 7
  UNION ALL SELECT 'Meat Market Supply', 'cancel', 750, 8
  UNION ALL SELECT 'Health Foods Group', 'received', 1900, 9
  UNION ALL SELECT 'Household Essentials', 'draft', 1190, 10
) o
INNER JOIN "suppliers" s ON s.name = o.supplier_name AND s.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4'
INNER JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM "invoice"
) i ON i.rn = o.invoice_num;

--> statement-breakpoint

-- Insert Order Items (2 items per order) - NOTE: Fixed FK references to orders and products
INSERT INTO "order_items" ("order_id", "product_id", "qty", "price", "tax", "discount", "created_at", "updated_at")
SELECT 
  o.id as order_id,
  p.id as product_id,
  oi.qty,
  oi.price,
  oi.tax,
  oi.discount,
  now(),
  now()
FROM (
  SELECT 1 as order_num, 'Whole Milk 1L' as product_name, 10 as qty, 299 as price, 30 as tax, 10 as discount
  UNION ALL SELECT 1, 'Greek Yogurt 500g', 5, 499, 50, 20
  UNION ALL SELECT 2, 'Potato Chips 200g', 15, 349, 60, 30
  UNION ALL SELECT 2, 'Chocolate Bar 100g', 20, 199, 40, 20
  UNION ALL SELECT 3, 'Orange Juice 1L', 8, 399, 35, 10
  UNION ALL SELECT 3, 'Cola 2L', 12, 249, 25, 5
  UNION ALL SELECT 4, 'Fresh Apples 1kg', 18, 449, 80, 50
  UNION ALL SELECT 4, 'Bananas 1kg', 25, 299, 75, 40
  UNION ALL SELECT 5, 'White Bread Loaf', 20, 279, 60, 30
  UNION ALL SELECT 5, 'Vanilla Ice Cream 1L', 10, 599, 70, 35
  UNION ALL SELECT 6, 'Whole Milk 1L', 12, 299, 40, 20
  UNION ALL SELECT 6, 'Potato Chips 200g', 8, 349, 30, 15
  UNION ALL SELECT 7, 'Orange Juice 1L', 30, 399, 120, 80
  UNION ALL SELECT 7, 'Fresh Apples 1kg', 22, 449, 100, 60
  UNION ALL SELECT 8, 'Greek Yogurt 500g', 6, 499, 35, 15
  UNION ALL SELECT 8, 'Chocolate Bar 100g', 10, 199, 20, 10
  UNION ALL SELECT 9, 'Cola 2L', 28, 249, 80, 50
  UNION ALL SELECT 9, 'Bananas 1kg', 16, 299, 60, 30
  UNION ALL SELECT 10, 'White Bread Loaf', 14, 279, 50, 25
  UNION ALL SELECT 10, 'Vanilla Ice Cream 1L', 8, 599, 55, 20
) oi
INNER JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM "orders" WHERE business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4'
) o ON o.rn = oi.order_num
INNER JOIN "products" p ON p.name = oi.product_name AND p.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4';



-- Insert Inventory Movements (linked to orders and products)
-- Creating movements for received orders (purchase movements)
INSERT INTO "inventory_movements" ("product_id", "order_id", "movement_type", "quantity", "created_at", "updated_at")
SELECT 
  p.id as product_id,
  o.id as order_id,
  'purchase' as movement_type,
  oi.qty as quantity,
  now(),
  now()
FROM "orders" o
INNER JOIN "suppliers" s ON o.supplier_id = s.id
INNER JOIN "order_items" oi ON oi.order_id = o.id
INNER JOIN "products" p ON oi.product_id = p.id
WHERE o.status = 'received' AND o.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4';

--> statement-breakpoint

-- Insert Sale movements (reducing stock)
INSERT INTO "inventory_movements" ("product_id", "order_id", "movement_type", "quantity", "created_at", "updated_at")
SELECT 
  p.id as product_id,
  NULL as order_id,
  'sale' as movement_type,
  -1 * (5 + (random() * 15)::int) as quantity,
  now() - interval '1 day' * (random() * 30)::int,
  now()
FROM "products" p
WHERE p.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4'
ORDER BY random()
LIMIT 15;

--> statement-breakpoint

-- Insert Adjustment movements (stock corrections)
INSERT INTO "inventory_movements" ("product_id", "order_id", "movement_type", "quantity", "created_at", "updated_at")
SELECT 
  p.id as product_id,
  NULL as order_id,
  'adjustment' as movement_type,
  CASE 
    WHEN random() > 0.5 THEN (random() * 10)::int
    ELSE -1 * (random() * 5)::int
  END as quantity,
  now() - interval '1 day' * (random() * 15)::int,
  now()
FROM "products" p
WHERE p.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4'
ORDER BY random()
LIMIT 8;

--> statement-breakpoint

-- Insert Return movements (for cancelled order)
INSERT INTO "inventory_movements" ("product_id", "order_id", "movement_type", "quantity", "created_at", "updated_at")
SELECT 
  p.id as product_id,
  o.id as order_id,
  'return' as movement_type,
  -1 * oi.qty as quantity,
  now(),
  now()
FROM "orders" o
INNER JOIN "suppliers" s ON o.supplier_id = s.id
INNER JOIN "order_items" oi ON oi.order_id = o.id
INNER JOIN "products" p ON oi.product_id = p.id
WHERE o.status = 'cancel' AND o.business_id = '07ed003d-9a1f-44f0-bcf5-6c29ecb248c4'
LIMIT 2;