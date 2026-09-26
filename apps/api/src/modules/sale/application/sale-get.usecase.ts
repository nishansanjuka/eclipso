import { Injectable, NotFoundException } from '@nestjs/common';
import { SaleService } from '../infrastructure/sale.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { type BranchScope } from '../../auth/domain/auth-context';

@Injectable()
export class SaleGetUseCase {
  constructor(
    private readonly saleService: SaleService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(id: string, orgId: string, scope: BranchScope) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      const sale = await this.saleService.getSaleById(id, businessId);

      if (!sale || !scope.canAccessBranch(sale.branchId)) {
        throw new NotFoundException(`Sale not found`);
      }

      return sale;
    }
  }
}
