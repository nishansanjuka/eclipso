import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { businesses } from './schema/business.schema';
import { sales } from '../../sale/infrastructure/schema/sale.schema';
import { orders } from '../../order/infrastructure/schema/order.schema';
import { products } from '../../product/infrastructure/schema/product.schema';
import { adjustments } from '../../adjustment/infrastructure/schema/adjustment.schema';
import { and, eq } from 'drizzle-orm';
import { taxes } from '../../tax/infrastructure/schema/tax.schema';
import { TaxType } from '../../tax/enums/tax.types.enum';
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

  async findProfile(orgId: string) {
    const [row] = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.orgId, orgId));
    return row;
  }

  async slugTaken(slug: string) {
    const [row] = await this.db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug));
    return !!row;
  }

  /**
   * Updates the profile / tax settings in one transaction. When the business
   * is VAT registered the standard rate is kept as the business's "VAT" tax so
   * the till can apply it; turning VAT off deactivates it (history keeps
   * pointing at it).
   */
  async updateProfile(
    orgId: string,
    patch: Partial<BusinessDto>,
    vatRate?: string,
  ) {
    return this.db.transaction(async (tx) => {
      // A patch with nothing in it (e.g. only a new VAT rate) has no columns to
      // set; read the row instead of issuing an empty UPDATE.
      const hasColumns = Object.values(patch).some((v) => v !== undefined);
      const [business] = hasColumns
        ? await tx
            .update(businesses)
            .set(patch)
            .where(eq(businesses.orgId, orgId))
            .returning()
        : await tx.select().from(businesses).where(eq(businesses.orgId, orgId));
      if (!business) return undefined;

      const vatRegistered = patch.vatRegistered;
      if (vatRegistered !== undefined || vatRate !== undefined) {
        const [existing] = await tx
          .select()
          .from(taxes)
          .where(and(eq(taxes.businessId, business.id), eq(taxes.name, 'VAT')));

        if (business.vatRegistered && vatRate !== undefined) {
          if (existing) {
            await tx
              .update(taxes)
              .set({ rate: vatRate, isActive: true, updatedAt: new Date() })
              .where(eq(taxes.id, existing.id));
          } else {
            await tx.insert(taxes).values({
              businessId: business.id,
              name: 'VAT',
              rate: vatRate,
              type: TaxType.PERCENTAGE,
              isActive: true,
            });
          }
        } else if (!business.vatRegistered && existing) {
          await tx
            .update(taxes)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(taxes.id, existing.id));
        }
      }
      return business;
    });
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
      // inventory_movements and branch_stock cascade from products.
      await tx.delete(products).where(eq(products.businessId, business.id));
      // adjustments reference branches (history is never orphaned), so they
      // must go before the branches cascade away with the business.
      await tx
        .delete(adjustments)
        .where(eq(adjustments.businessId, business.id));
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
