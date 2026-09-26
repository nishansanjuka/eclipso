import { Injectable } from '@nestjs/common';
import {
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
} from '../dto/adjustment.dto';
import { AdjustmentRepository } from './adjustment.repository';

@Injectable()
export class AdjustmentService {
  constructor(private readonly adjustmentRepository: AdjustmentRepository) {}

  async createAdjustment(adjustmentData: CreateAdjustmentDto) {
    return this.adjustmentRepository.create(adjustmentData);
  }

  async findAdjustmentById(id: string, businessId: string) {
    return this.adjustmentRepository.findById(id, businessId);
  }

  async findAdjustmentsByBusinessId(businessId: string) {
    return this.adjustmentRepository.findByBusinessId(businessId);
  }

  async findAdjustmentsByUserId(userId: string) {
    return this.adjustmentRepository.findByUserId(userId);
  }

  async findAdjustmentsByBusinessAndUser(businessId: string, userId: string) {
    return this.adjustmentRepository.findByBusinessAndUser(businessId, userId);
  }

  async updateAdjustment(
    id: string,
    businessId: string,
    adjustmentData: UpdateAdjustmentDto,
  ) {
    return this.adjustmentRepository.update(id, businessId, adjustmentData);
  }

  async deleteAdjustment(id: string, businessId: string) {
    return this.adjustmentRepository.delete(id, businessId);
  }

  async getAllAdjustments(businessId: string, limit?: number) {
    return this.adjustmentRepository.getAll(businessId, limit);
  }
}
