import { Injectable } from '@nestjs/common';
import {
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from '../dto/inventory.movement';
import { InventoryMovementsRepository } from './inventory.movements.repository';

@Injectable()
export class InventoryMovementService {
  constructor(
    private readonly inventoryMovementRepository: InventoryMovementsRepository,
  ) {}

  async create(inventoryData: CreateInventoryMovementDto) {
    return await this.inventoryMovementRepository.create(inventoryData);
  }

  async update(id: string, inventoryData: UpdateInventoryMovementDto) {
    return await this.inventoryMovementRepository.update(id, inventoryData);
  }

  async delete(id: string) {
    return await this.inventoryMovementRepository.delete(id);
  }

  async getByOrderAndProductId(orderId: string, productId: string) {
    return await this.inventoryMovementRepository.getByOrderAndProductId(
      orderId,
      productId,
    );
  }
}
