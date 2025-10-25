import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { users } from './schema/user.schema';
import { UserCreateDto } from '../dto/user.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createUser(userData: UserCreateDto) {
    const result = await this.db.insert(users).values(userData).returning();
    return result;
  }

  async deleteUserByClerkId(clerkId: string) {
    const result = await this.db
      .delete(users)
      .where(eq(users.clerkId, clerkId))
      .returning();
    return result;
  }
}
