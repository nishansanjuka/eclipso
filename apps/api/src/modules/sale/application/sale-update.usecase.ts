import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateSaleDto } from '../dto/sale.dto';
import { SaleCheckoutRepository } from '../infrastructure/sale-checkout.repository';
import { SaleUpdateEntity } from '../domain/sale.entity';
import { SaleStatusEnum } from '../infrastructure/enums/sale.enum';
import { type BranchScope } from '../../auth/domain/auth-context';

/**
 * Only the customer attached to a sale can be changed after the fact. Totals,
 * lines and payments are immutable: corrections go through returns/voids so
 * stock and money always reconcile.
 */
@Injectable()
export class SaleUpdateUseCase {
  constructor(private readonly checkout: SaleCheckoutRepository) {}

  async execute(
    id: string,
    businessId: string,
    saleData: UpdateSaleDto,
    scope: BranchScope,
  ) {
    const data = new SaleUpdateEntity(saleData);

    return this.checkout.transaction(async (tx) => {
      const sale = await this.checkout.lockSale(tx, businessId, id);
      // Same answer for "missing" and "another branch's sale".
      if (
        !sale ||
        !scope.canAccessBranch(sale.branchId) ||
        sale.status !== SaleStatusEnum.COMPLETED
      ) {
        throw new NotFoundException('Sale not found');
      }

      // Nothing to change (an explicit null detaches the customer).
      if (data.customerId === undefined) return sale;

      if (
        data.customerId &&
        !(await this.checkout.customerExists(tx, businessId, data.customerId))
      ) {
        throw new NotFoundException(
          `Customer with ID ${data.customerId} not found`,
        );
      }

      return this.checkout.setSaleCustomer(tx, sale.id, data.customerId);
    });
  }
}
