import { Controller, Get } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  async findAll(@User() user: AuthUserObject) {
    const { id } = await this.businessService.getBusinessWithUserByOrgId(
      user.orgId!,
    );

    console.log(id);
    return { msg: 'ahh' };
  }
}
