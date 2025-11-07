import { brands } from '../../modules/brand/infrastructure/schema/brand.schema';
import {
  businesses,
  businessTypeEnum,
} from '../../modules/business/infrastructure/schema/business.schema';
import {
  discounts,
  discountTypeEnum,
} from '../../modules/discount/infrastructure/schema/discount.schema';
import {
  inventoryMovements,
  movementEnum,
} from '../../modules/inventory/infrastructure/schema/inventory.movement.schema';
import { invoices } from '../../modules/invoice/infrastructure/schema/invoice.schema';
import { orderItems } from '../../modules/order/infrastructure/schema/order.item.schema';
import {
  orders,
  orderStatusEnum,
} from '../../modules/order/infrastructure/schema/order.schema';
import { categories } from '../../modules/product/infrastructure/schema/category.schema';
import { products } from '../../modules/product/infrastructure/schema/product.schema';
import { suppliers } from '../../modules/suppliers/infrastructure/schema/supplier.schema';
import {
  taxes,
  taxTypeEnum,
} from '../../modules/tax/infrastructure/schema/tax.schema';
import { users } from '../../modules/users/infrastructure/schema/user.schema';
import {
  businessesRelations,
  businessUsers,
  businessUsersRelations,
  usersRelations,
} from './relations/business.user.schema';
import {
  discountsRelations,
  orderItemsDiscounts,
  orderItemsDiscountsRelations,
} from './relations/order-items.discount.schema';
import {
  orderItemsTaxes,
  orderItemsTaxesRelations,
  taxesRelations,
} from './relations/order-items.tax.schema';
import { orderItemsRelations } from './relations/order-items.relations';
import {
  categoryRelations,
  productCategory,
  productCategoryRelations,
  productRelations,
} from './relations/product.category.schema';
import {
  actionTypeEnum,
  auditLogs,
  logTypeEnum,
} from '../../modules/audit/infrastructure/schema/audit-log.schema';
import { adjustments } from '../../modules/adjustment/infrastructure/schema/adjustment.schema';

export const UsersTable = users;
export const BusinessTable = businesses;
export const BusinessUsersTable = businessUsers;
export const SuppliersTable = suppliers;
export const OrdersTable = orders;
export const ProductsTable = products;
export const OrderItemsTable = orderItems;
export const CategoriesTable = categories;
export const InventoryMovementsTable = inventoryMovements;
export const InvoiceTable = invoices;
export const ProductCategoryTable = productCategory;
export const BrandTable = brands;
export const TaxTable = taxes;
export const DiscountTable = discounts;
export const OrderItemsTaxesTable = orderItemsTaxes;
export const OrderItemsDiscountsTable = orderItemsDiscounts;
export const AuditLogsTable = auditLogs;
export const AdjustmentsTable = adjustments;

// relations for tables
export const UsersRelations = usersRelations;
export const BusinessesRelations = businessesRelations;
export const BusinessUserRelations = businessUsersRelations;
export const ProductRelations = productRelations;
export const CategoryRelations = categoryRelations;
export const ProductCategoryRelations = productCategoryRelations;
export const OrderItemsRelations = orderItemsRelations;
export const OrderItemsDiscountsRelations = orderItemsDiscountsRelations;
export const OrderItemsTaxesRelations = orderItemsTaxesRelations;
export const TaxesRelations = taxesRelations;
export const DiscountsRelations = discountsRelations;

// ENUM for Business Types
export const BusinessTypeEnum = businessTypeEnum;
export const MovementEnum = movementEnum;
export const OrderStatusEnum = orderStatusEnum;
export const DiscountTypeEnum = discountTypeEnum;
export const TaxTypeEnum = taxTypeEnum;
export const ActionTypeEnum = actionTypeEnum;
export const LogTypeEnum = logTypeEnum;
