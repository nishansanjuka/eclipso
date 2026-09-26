import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { OrderStatus } from '../infrastructure/enums/order.enum';

// Evaluated per request (not at import time), so "in the future" stays true.
const futureDate = (label: string) =>
  z.coerce
    .date({ error: `Invalid ${label}` })
    .refine((d) => d.getTime() > Date.now(), `${label} must be in the future`);

export class OrderCreateEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Invalid Supplier Id' })
      .uuid('Supplier Id must be a valid UUID'),
  )
  public readonly supplierId: string;

  @Z(futureDate('Expected date'))
  public readonly expectedDate: Date;

  constructor(params: CreateOrderDto) {
    super(params);
    this.supplierId = params.supplierId;
    this.expectedDate = new Date(params.expectedDate);
  }
}

export class OrderUpdateEntity extends BaseModel {
  @Z(futureDate('Expected date').optional())
  public readonly expectedDate?: Date;

  @Z(
    z
      .literal(OrderStatus.CANCEL, {
        error:
          "Only 'cancel' can be set here; receive an order through the receive endpoint",
      })
      .optional(),
  )
  public readonly status?: OrderStatus.CANCEL;

  constructor(params: UpdateOrderDto) {
    super(params);
    this.expectedDate = params.expectedDate
      ? new Date(params.expectedDate)
      : undefined;
    this.status = params.status as OrderStatus.CANCEL | undefined;
  }
}
