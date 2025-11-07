import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import {
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from '../dto/inventory.movement';
import { inventoryMovements } from './schema/inventory.movement.schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class InventoryMovementsRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async create(inventoryData: CreateInventoryMovementDto) {
    return await this.db.insert(inventoryMovements).values(inventoryData);
  }

  async createBulk(inventoryData: CreateInventoryMovementDto[]) {
    return await this.db
      .insert(inventoryMovements)
      .values(inventoryData)
      .returning();
  }

  async update(id: string, inventoryData: UpdateInventoryMovementDto) {
    return await this.db
      .update(inventoryMovements)
      .set(inventoryData)
      .where(eq(inventoryMovements.id, id));
  }

  async delete(id: string) {
    return await this.db
      .delete(inventoryMovements)
      .where(eq(inventoryMovements.id, id));
  }

  async getByOrderAndProductId(orderId: string, productId: string) {
    const [res] = await this.db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.orderId, orderId),
          eq(inventoryMovements.productId, productId),
        ),
      );

    return res;
  }
}
