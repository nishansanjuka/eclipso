import { Injectable } from '@nestjs/common';
import { UpdateAdjustmentDto } from '../dto/adjustment.dto';
import { type BranchScope } from '../../auth/domain/auth-context';
import { AdjustmentRepository } from './adjustment.repository';

/** Read/edit side. Adjustments are created through `AdjustmentCreateUsecase`. */
@Injectable()
export class AdjustmentService {
  constructor(private readonly adjustmentRepository: AdjustmentRepository) {}

  async findAdjustmentById(id: string, businessId: string, scope: BranchScope) {
    return this.adjustmentRepository.findById(id, businessId, scope);
  }

  async findAdjustmentsByBusinessId(businessId: string, scope: BranchScope) {
    return this.adjustmentRepository.findByBusinessId(businessId, scope);
  }

  async findAdjustmentsByBusinessAndUser(
    businessId: string,
    userId: string,
    scope: BranchScope,
  ) {
    return this.adjustmentRepository.findByBusinessAndUser(
      businessId,
      userId,
      scope,
    );
  }

  async updateAdjustment(
    id: string,
    businessId: string,
    adjustmentData: UpdateAdjustmentDto,
    scope: BranchScope,
  ) {
    return this.adjustmentRepository.update(
      id,
      businessId,
      adjustmentData,
      scope,
    );
  }

  async deleteAdjustment(id: string, businessId: string, scope: BranchScope) {
    return this.adjustmentRepository.delete(id, businessId, scope);
  }

  async getAllAdjustments(
    businessId: string,
    scope: BranchScope,
    limit?: number,
  ) {
    return this.adjustmentRepository.getAll(businessId, scope, limit);
  }
}
