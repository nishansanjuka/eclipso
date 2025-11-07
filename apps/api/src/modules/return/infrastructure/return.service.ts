import { Injectable } from '@nestjs/common';
import { ReturnRepository } from './return.repository';
import {
  CreateRefundDto,
  CreateReturnDto,
  CreateReturnItemDto,
} from '../dto/return.dto';

@Injectable()
export class ReturnService {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async createReturn(
    returnData: Omit<CreateReturnDto, 'items' | 'refund'> & { userId: string },
  ) {
    return await this.returnRepository.createReturn(returnData);
  }

  async createReturnItem(
    returnItemData: CreateReturnItemDto & { returnId: string },
  ) {
    return await this.returnRepository.createReturnItem(returnItemData);
  }

  async createReturnItems(
    returnItemsData: (CreateReturnItemDto & { returnId: string })[],
  ) {
    return await this.returnRepository.createReturnItems(returnItemsData);
  }

  async createRefund(
    refundData: CreateRefundDto & { returnId: string; userId: string },
  ) {
    return await this.returnRepository.createRefund(refundData);
  }

  async updateReturn(id: string, returnData: Partial<CreateReturnDto>) {
    return await this.returnRepository.updateReturn(id, returnData);
  }

  async deleteReturn(id: string) {
    await this.returnRepository.deleteReturnItemsByReturnId(id);
    return await this.returnRepository.deleteReturn(id);
  }

  async getReturnById(id: string) {
    const returnRecord = await this.returnRepository.getReturnById(id);
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
