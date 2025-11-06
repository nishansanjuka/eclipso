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
      .string({ error: 'Invalid Total Tax' })
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Total Tax must be a valid decimal number with up to 2 decimal places',
      )
      .refine((val) => parseFloat(val) >= 0, 'Total Tax must be positive')
      .optional(),
  )
  public readonly totalTax?: string;

  @Z(
    z
      .string({ error: 'Invalid Total Discount' })
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Total Discount must be a valid decimal number with up to 2 decimal places',
      )
      .refine((val) => parseFloat(val) >= 0, 'Total Discount must be positive')
      .optional(),
  )
  public readonly totalDiscount?: string;

  @Z(
    z
      .string({ error: 'Invalid Subtotal' })
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Subtotal must be a valid decimal number with up to 2 decimal places',
      )
      .refine((val) => parseFloat(val) >= 0, 'Subtotal must be positive')
      .optional(),
  )
  public readonly subTotal?: string;

  @Z(
    z
      .string({ error: 'Invalid Grand Total' })
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Grand Total must be a valid decimal number with up to 2 decimal places',
      )
      .refine((val) => parseFloat(val) >= 0, 'Grand Total must be positive')
      .optional(),
  )
  public readonly grandTotal?: string;

  constructor(params: InvoiceCreateDto) {
    super(params);
    this.invoiceNumber = params.invoiceNumber;
    this.totalTax = params.totalTax;
    this.totalDiscount = params.totalDiscount;
    this.subTotal = params.subTotal;
    this.grandTotal = params.grandTotal;
  }
}
