import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from '../../../modules/product/infrastructure/schema/product.schema';
import { categories } from '../../../modules/product/infrastructure/schema/category.schema';

// Join table for many-to-many relationship
export const productCategory = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })], // composite PK
);

// Relations for Products → link to categories through join table
export const productRelations = relations(products, ({ many }) => ({
  categories: many(productCategory),
}));

// Relations for Categories → link to products through join table
export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(productCategory),
}));

// Relations for the join table → link back to single product and category
export const productCategoryRelations = relations(
  productCategory,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategory.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategory.categoryId],
      references: [categories.id],
    }),
  }),
);
