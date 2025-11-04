import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { InvoiceCreateDto } from '../dto/invoice.dto';

export class InvoiceCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Invoice number is required' })
      .min(1, 'Invoice number cannot be empty')
      .regex(
        /^in_[0-9a-f]{32}$/,
        'Invoice number must match format: in_<32 hex characters>',
      )
      .optional(), // Make optional since it has a database default
  )
  public readonly invoiceNumber?: string;

  @Z(
    z
      .number({ error: 'Invalid Total Amount' })
      .min(0, 'Total Amount must be positive'),
  )
  public readonly totalTax?: number;

  @Z(
    z
      .number({ error: 'Invalid Total Discount' })
      .min(0, 'Total Discount must be positive'),
  )
  public readonly totalDiscount?: number;

  @Z(
    z.number({ error: 'Invalid Subtotal' }).min(0, 'Subtotal must be positive'),
  )
  public readonly subTotal?: number;

  @Z(
    z
      .number({ error: 'Invalid Grand Total' })
      .min(0, 'Grand Total must be positive'),
  )
  public readonly grandTotal?: number;

  constructor(params: InvoiceCreateDto) {
    super(params);
    this.invoiceNumber = params.invoiceNumber;
    this.totalTax = params.totalTax;
    this.totalDiscount = params.totalDiscount;
    this.subTotal = params.subTotal;
    this.grandTotal = params.grandTotal;
  }
}
