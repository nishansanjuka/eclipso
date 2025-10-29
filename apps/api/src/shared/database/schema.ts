import {
  businesses,
  businessTypeEnum,
} from '../../modules/business/infrastructure/schema/business.schema';
import { orderItems } from '../../modules/order/infrastructure/schema/order.item.schema';
import { orders } from '../../modules/order/infrastructure/schema/order.schema';
import { products } from '../../modules/product/infrastructure/schema/product.schema';
import { suppliers } from '../../modules/suppliers/infrastructure/schema/supplier.schema';
import { users } from '../../modules/users/infrastructure/schema/user.schema';
import {
  businessesRelations,
  businessUsers,
  businessUsersRelations,
  usersRelations,
} from './relations/business.user.schema';

export const UsersTable = users;
export const BusinessTable = businesses;
export const BusinessUsersTable = businessUsers;
export const SuppliersTable = suppliers;
export const OrdersTable = orders;
export const ProductsTable = products;
export const OrderItemsTable = orderItems;

// relations for business users
export const UsersRelations = usersRelations;
export const BusinessesRelations = businessesRelations;
export const BusinessUserRelations = businessUsersRelations;

// ENUM for Business Types
export const BusinessTypeEnum = businessTypeEnum;
