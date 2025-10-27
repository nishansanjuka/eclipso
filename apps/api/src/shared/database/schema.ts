import {
  businesses,
  businessTypeEnum,
} from '../../modules/business/infrastructure/schema/business.schema';
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

// relations for business users
export const UsersRelations = usersRelations;
export const BusinessesRelations = businessesRelations;
export const BusinessUserRelations = businessUsersRelations;

// ENUM for Business Types
export const BusinessTypeEnum = businessTypeEnum;
