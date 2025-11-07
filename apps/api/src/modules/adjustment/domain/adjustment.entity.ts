import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import {
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
} from '../dto/adjustment.dto';

export class AdjustmentCreateEntity extends BaseModel {
  @Z(z.uuidv4().optional())
  public readonly id?: string;

  @Z(
    z
      .uuidv4({ message: 'Business ID must be a valid UUID' })
      .min(1, { message: 'Business ID cannot be empty' }),
  )
  public readonly businessId: string;

  @Z(
    z
      .string({ error: 'User ID is required' })
      .min(1, { message: 'User ID cannot be empty' }),
  )
  public readonly userId: string;

  @Z(
    z
      .string({ error: 'Reason is required' })
      .min(3, { message: 'Reason must be at least 3 characters long' })
      .max(500, { message: 'Reason must not exceed 500 characters' }),
  )
  public readonly reason: string;

  constructor(props: CreateAdjustmentDto) {
    super(props);
    if (props.id) {
      this.id = props.id;
    }
    this.businessId = props.businessId;
    this.userId = props.userId;
    this.reason = props.reason;
  }
}

export class AdjustmentUpdateEntity extends BaseModel {
  @Z(z.uuidv4().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Reason is required' })
      .min(3, { message: 'Reason must be at least 3 characters long' })
      .max(500, { message: 'Reason must not exceed 500 characters' })
      .optional(),
  )
  public readonly reason?: string;

  constructor(props: UpdateAdjustmentDto) {
    super(props);
    if (props.id) {
      this.id = props.id;
    }
    if (props.reason) {
      this.reason = props.reason;
    }
  }
}
