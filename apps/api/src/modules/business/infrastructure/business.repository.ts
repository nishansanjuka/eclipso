import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { businesses } from './schema/business.schema';
import { sales } from '../../sale/infrastructure/schema/sale.schema';
import { orders } from '../../order/infrastructure/schema/order.schema';
import { products } from '../../product/infrastructure/schema/product.schema';
import { eq } from 'drizzle-orm';
import { BusinessDto } from '../dto/business.dto';

@Injectable()
export class BusinessRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async updateBusiness(updateData: Partial<BusinessDto>) {
    await this.db
      .update(businesses)
      .set(updateData)
      .where(eq(businesses.orgId, updateData.orgId!));
  }

  /**
   * Deletes a business and everything it owns.
   *
   * History-bearing foreign keys (sold products, suppliers with products, ...)
   * are NO ACTION so that deleting a product/supplier/customer can never wipe
   * out records. Postgres checks those per cascaded statement, so a plain
   * `DELETE FROM businesses` trips over them; instead the referencing rows are
   * removed first, in dependency order, in one transaction.
   */
  async deleteBusiness(orgId: string) {
    await this.db.transaction(async (tx) => {
      const [business] = await tx
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.orgId, orgId));
      if (!business) return;

      // sale_items, payments, returns, refunds cascade from sales.
      await tx.delete(sales).where(eq(sales.businessId, business.id));
      // order_items cascade from orders.
      await tx.delete(orders).where(eq(orders.businessId, business.id));
      // inventory_movements cascade from products.
      await tx.delete(products).where(eq(products.businessId, business.id));
      // suppliers, brands, customers, taxes, discounts, roles, memberships...
      await tx.delete(businesses).where(eq(businesses.id, business.id));
    });
  }

  async getBusinessWithUserByOrgId(orgId: string) {
    const business = await this.db.query.BusinessTable.findFirst({
      where: eq(businesses.orgId, orgId),
      with: {
        userLinks: {
          columns: {
            userClerkId: false,
            businessId: false,
          },
          with: {
            user: {
              columns: {
                clerkId: false,
              },
            },
          },
        },
      },
      columns: {
        orgId: false,
      },
    });

    return business;
  }
}
