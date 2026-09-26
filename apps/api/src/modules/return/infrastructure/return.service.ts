import { Injectable } from '@nestjs/common';
import { ReturnRepository } from './return.repository';
import { type BranchScope } from '../../auth/domain/auth-context';

/** Read side only. Returns are created through `ReturnCreateUseCase`. */
@Injectable()
export class ReturnService {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async getReturnById(id: string, businessId: string, scope: BranchScope) {
    const returnRecord = await this.returnRepository.getReturnById(
      id,
      businessId,
    );
    // Same answer for "missing" and "another branch's return".
    if (!returnRecord || !scope.canAccessBranch(returnRecord.branchId)) {
      return null;
    }

    const items = await this.returnRepository.getReturnItemsByReturnId(
      returnRecord.id,
    );
    const refund = await this.returnRepository.getRefundByReturnId(
      returnRecord.id,
    );

    return {
      ...returnRecord,
      items,
      refund,
    };
  }
}
