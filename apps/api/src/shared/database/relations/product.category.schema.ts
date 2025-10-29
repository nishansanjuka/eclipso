import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';
import { products } from '../../../modules/product/infrastructure/schema/product.schema';
import { categories } from '../../../modules/product/infrastructure/schema/category.schema';

export const productCategory = pgTable(
  'product_categories',
  {
    id: uuid('id').defaultRandom().unique().notNull().primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

export const productRelations = relations(products, ({ many }) => ({
  categoryLinks: many(productCategory),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  productLinks: many(productCategory),
}));

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
