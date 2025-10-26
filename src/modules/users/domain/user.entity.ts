import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { UserCreateDto } from '../dto/user.dto';

export class UserEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string | null;
  @Z(
    z
      .string({ error: 'Invalid Business ID' })
      .min(1, 'Business ID is required'),
  )
  public readonly businessId: string;

  @Z(z.string({ error: 'Invalid Clerk ID' }).min(1, 'Clerk ID is required'))
  public readonly clerkId: string;

  @Z(z.string({ error: 'Invalid Name' }).min(1, 'Name is required'))
  public readonly name: string;

  constructor(params: UserCreateDto) {
    super(params);
    this.clerkId = params.clerkId;
    this.name = params.name;
  }
}
