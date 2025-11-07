import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnDto } from '../dto/return.dto';
import { ReturnService } from '../infrastructure/return.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { SaleService } from '../../sale/infrastructure/sale.service';
import { InventoryMovementService } from '../../inventory/infrastructure/inventory.movements.service';
import { ProductService } from '../../product/infrastructure/product.service';
import { ReturnCreateEntity } from '../domain/return.entity';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { sql } from 'drizzle-orm';

@Injectable()
export class ReturnCreateUseCase {
  constructor(
    @Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient,
    private readonly returnService: ReturnService,
    private readonly businessService: BusinessService,
    private readonly saleService: SaleService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly productService: ProductService,
  ) {}

  async execute(
    orgId: string,
    userId: string,
    returnData: Omit<CreateReturnDto, 'userId'>,
  ) {
    // Get business from orgId
    const business =
      await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const businessId = business.id;

    // Execute everything in a transaction
    return await this.db.transaction(async () => {
      // Step 1: Validate sale exists and belongs to business
      const sale = await this.saleService.getSaleById(
        returnData.saleId,
        businessId,
      );

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      // Step 2: Validate return items exist in the sale
      for (const item of returnData.items) {
        const saleItem = sale.items.find((si) => si.id === item.saleItemId);

        if (!saleItem) {
          throw new NotFoundException(
            `Sale item with ID ${item.saleItemId} not found in this sale`,
          );
        }

        if (item.qtyReturned > saleItem.qty) {
          throw new BadRequestException(
            `Cannot return ${item.qtyReturned} items. Only ${saleItem.qty} were purchased.`,
          );
        }
      }

      // Step 3: Create the return entity
      const returnEntity = new ReturnCreateEntity({
        ...returnData,
        userId,
      });

      // Step 4: Create the return record
      const [returnRecord] = await this.returnService.createReturn({
        saleId: returnEntity.saleId,
        userId: returnEntity.userId,
        qty: returnEntity.qty,
        reason: returnEntity.reason,
        status: returnEntity.status,
        notes: returnEntity.notes,
      });

      // Step 5: Create return items
      const returnItemRecords = await this.returnService.createReturnItems(
        returnEntity.items.map((item) => ({
          returnId: returnRecord.id,
          saleItemId: item.saleItemId,
          qtyReturned: item.qtyReturned,
        })),
      );

      // Step 6: Create inventory movements and update product stock
      const inventoryMovements: Awaited<
        ReturnType<typeof this.inventoryMovementService.createBulk>
      > = [];
      for (const item of returnItemRecords) {
        // Get the sale item to find the product
        const saleItem = sale.items.find((si) => si.id === item.saleItemId);
        if (!saleItem) continue;

        // Create inventory movement (IN - adding back to stock)
        const movements = await this.inventoryMovementService.createBulk([
          {
            productId: saleItem.productId,
            qty: item.qtyReturned, // Positive quantity for return (stock IN)
            movementType: InventoryMovementTypeEnum.RETURN,
          },
        ]);
        inventoryMovements.push(...movements);

        // Update product stock (increment)
        await this.productService.updateProductStockBySql(
          saleItem.productId,
          businessId,
          sql`stock_qty + ${item.qtyReturned}`,
        );
      }

      // Step 7: Create refund if provided
      let refund:
        | Awaited<ReturnType<typeof this.returnService.createRefund>>[0]
        | null = null;
      if (returnEntity.refund) {
        const [createdRefund] = await this.returnService.createRefund({
          returnId: returnRecord.id,
          userId: returnEntity.userId,
          method: returnEntity.refund.method,
          amount: returnEntity.refund.amount,
          reason: returnEntity.refund.reason,
          transactionRef: returnEntity.refund.transactionRef,
        });
        refund = createdRefund;
      }

      // Step 8: Return complete return data
      return {
        return: returnRecord,
        items: returnItemRecords,
        inventoryMovements,
        refund,
      };
    });
  }
}
