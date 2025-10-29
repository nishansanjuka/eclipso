import {
  businesses,
  businessTypeEnum,
} from '../../modules/business/infrastructure/schema/business.schema';
import {
  inventoryMovements,
  movementEnum,
} from '../../modules/inventory/infrastructure/schema/inventory.movement.schema';
import { orderItems } from '../../modules/order/infrastructure/schema/order.item.schema';
import {
  orders,
  orderStatusEnum,
} from '../../modules/order/infrastructure/schema/order.schema';
import { categories } from '../../modules/product/infrastructure/schema/category.schema';
import { products } from '../../modules/product/infrastructure/schema/product.schema';
import { suppliers } from '../../modules/suppliers/infrastructure/schema/supplier.schema';
import { users } from '../../modules/users/infrastructure/schema/user.schema';
import {
  businessesRelations,
  businessUsers,
  businessUsersRelations,
  usersRelations,
} from './relations/business.user.schema';
import { productRelations } from './relations/product.category.schema';

export const UsersTable = users;
export const BusinessTable = businesses;
export const BusinessUsersTable = businessUsers;
export const SuppliersTable = suppliers;
export const OrdersTable = orders;
export const ProductsTable = products;
export const OrderItemsTable = orderItems;
export const CategoriesTable = categories;
export const InventoryMovementsTable = inventoryMovements;

// relations for tables
export const UsersRelations = usersRelations;
export const BusinessesRelations = businessesRelations;
export const BusinessUserRelations = businessUsersRelations;
export const ProductRelations = productRelations;

// ENUM for Business Types
export const BusinessTypeEnum = businessTypeEnum;
export const MovementEnum = movementEnum;
export const OrderStatusEnum = orderStatusEnum;
