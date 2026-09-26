import { Injectable } from '@nestjs/common';
import { ReturnRepository } from './return.repository';

/** Read side only. Returns are created through `ReturnCreateUseCase`. */
@Injectable()
export class ReturnService {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async getReturnById(id: string, businessId: string) {
    const returnRecord = await this.returnRepository.getReturnById(
      id,
      businessId,
    );
    if (!returnRecord) return null;

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
