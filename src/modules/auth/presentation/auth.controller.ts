import { Body, Controller, Post } from '@nestjs/common';
import { AuthUseCase } from '../application/auth-use-case';
import { CreateOrganizationDto } from '../dto/auth.dto';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../types/globals';
import { CreateOrganizationEntity } from '../domain/organization.entity';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';

@Controller('/auth/clerk')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  @Post('organization')
  @CatchEntityErrors()
  async createOrganization(
    @User() user: AuthUserObject,
    @Body() body: CreateOrganizationDto,
  ) {
    const { businessType, name } = new CreateOrganizationEntity(body);
    return this.authUseCase.createOrganization(
      name,
      user.userId!,
      businessType,
    );
  }
}
