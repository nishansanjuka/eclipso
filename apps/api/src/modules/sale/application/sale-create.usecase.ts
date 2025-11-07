import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSaleDto } from '../dto/sale.dto';
import { SaleService } from '../infrastructure/sale.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { ProductService } from '../../product/infrastructure/product.service';
import { InventoryMovementService } from '../../inventory/infrastructure/inventory.movements.service';
import { PaymentService } from '../../payment/infrastructure/payment.service';
import { SaleCreateEntity } from '../domain/sale.entity';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { sql } from 'drizzle-orm';

@Injectable()
export class SaleCreateUseCase {
  constructor(
    @Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient,
    private readonly saleService: SaleService,
    private readonly businessService: BusinessService,
    private readonly productService: ProductService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly paymentService: PaymentService,
  ) {}

  async execute(orgId: string, saleData: Omit<CreateSaleDto, 'businessId'>) {
    // Get business from orgId
    const business =
      await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const businessId = business.id;

    // Execute everything in a transaction
    return await this.db.transaction(async () => {
      // Step 1: Validate all products exist and have sufficient stock
      for (const item of saleData.items) {
        const product = await this.productService.getProductById(
          item.productId,
          businessId,
        );

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        if (product.stockQty < item.qty) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.stockQty}, Required: ${item.qty}`,
          );
        }
      }

      // Step 2: Create the sale entity
      const saleEntity = new SaleCreateEntity({
        ...saleData,
        businessId,
      });

      // Step 3: Create the sale record
      const [sale] = await this.saleService.createSale({
        businessId: saleEntity.businessId,
        customerId: saleEntity.customerId,
        totalAmount: saleEntity.totalAmount,
        qty: saleEntity.qty,
      });

      // Step 4: Create sale items
      const saleItems = await this.saleService.createSaleItems(
        saleEntity.items.map((item) => ({
          productId: item.productId,
          discountId: item.discountId,
          taxId: item.taxId,
          qty: item.qty,
          price: item.price,
          saleId: sale.id,
        })),
      );

      // Step 5: Create inventory movements and update product stock
      const inventoryMovements: Awaited<
        ReturnType<typeof this.inventoryMovementService.createBulk>
      > = [];
      for (const item of saleItems) {
        // Create inventory movement (OUT)
        const movements = await this.inventoryMovementService.createBulk([
          {
            productId: item.productId,
            saleId: sale.id,
            qty: -item.qty, // Negative quantity for sale (OUT)
            movementType: InventoryMovementTypeEnum.SALE,
          },
        ]);
        inventoryMovements.push(...movements);

        // Update product stock (decrement)
        await this.productService.updateProductStockBySql(
          item.productId,
          businessId,
          sql`stock_qty - ${item.qty}`,
        );
      }

      // Step 6: Create payment if provided
      let payment:
        | Awaited<ReturnType<typeof this.paymentService.createPayment>>[0]
        | null = null;
      if (saleEntity.payment) {
        const [createdPayment] = await this.paymentService.createPayment({
          saleId: sale.id,
          method: saleEntity.payment.method,
          amount: saleEntity.payment.amount,
          status: saleEntity.payment.status,
          transactionRef: saleEntity.payment.transactionRef,
        });
        payment = createdPayment;
      }

      // Step 7: Return complete sale data
      return {
        sale,
        items: saleItems,
        inventoryMovements,
        payment,
      };
    });
  }
}
