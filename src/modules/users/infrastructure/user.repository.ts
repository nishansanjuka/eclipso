import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { UserEntity } from '../domain/user.entity';
import { users } from './schema/user.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createUser(userData: Omit<UserEntity, 'id'>) {
    const res = await this.db.insert(users).values(userData).returning();
    return res[0];
  }

  async findUserById(id: string) {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user[0] || null;
  }

  async findUserByBusinessId(businessId: string) {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.businessId, businessId))
      .limit(1);
    return user[0] || null;
  }

  async findUserByClerkId(clerkId: string) {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    return user[0] || null;
  }

  async updateUserById(
    id: string,
    updateData: Partial<Omit<UserEntity, 'id'>>,
  ) {
    const res = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return res[0];
  }

  async updateUserByClerkId(
    clerkId: string,
    updateData: Partial<Omit<UserEntity, 'id'>>,
  ) {
    console.log('updating...', clerkId, updateData);
    const res = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.clerkId, clerkId))
      .returning();
    return res[0];
  }

  async deleteUserById(id: string) {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async deleteUserByClerkId(clerkId: string) {
    await this.db.delete(users).where(eq(users.clerkId, clerkId));
  }
}
