import { timestamp } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { products } from '../../../product/infrastructure/schema/product.schema';
import { integer } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { InventoryMovementTypeEnum } from '../enums/inventory.movement.enum';
import { orders } from '../../../order/infrastructure/schema/order.schema';

export const movementEnum = pgEnum(
  'movement_type_enum',
  InventoryMovementTypeEnum,
);

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().unique().notNull(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, {
      onDelete: 'cascade',
    }),
  qty: integer('quantity').notNull().default(0),
  movementType: movementEnum('movement_type')
    .notNull()
    .default(InventoryMovementTypeEnum.ADJUSTMENT),
  orderId: uuid('order_id').references(() => orders.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
