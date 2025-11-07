import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CustomerCreateUseCase } from '../application/customer-create.usecase';
import { CreateCustomerDto } from '../dto/customer.dto';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CustomerUpdateUseCase } from '../application/customer-update.usecase';
import { CustomerDeleteUseCase } from '../application/customer-delete.usecase';
import { CUSTOMER_API_OPERATIONS } from '../constants/api-operations';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerCreateUseCase: CustomerCreateUseCase,
    private readonly customerUpdateUseCase: CustomerUpdateUseCase,
    private readonly customerDeleteUseCase: CustomerDeleteUseCase,
  ) {}

  @ApiOperation({
    operationId: CUSTOMER_API_OPERATIONS.CREATE.operationId,
    description: CUSTOMER_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateCustomerDto })
  @Post('create')
  @CatchEntityErrors()
  createCustomer(
    @Body() customerData: CreateCustomerDto,
    @User() user: AuthUserObject,
  ) {
    return this.customerCreateUseCase.execute(user.orgId!, customerData);
  }

  @ApiOperation({
    operationId: CUSTOMER_API_OPERATIONS.UPDATE.operationId,
    description: CUSTOMER_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Customer ID' })
  @ApiBody({ type: CreateCustomerDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateCustomer(
    @Param('id') id: string,
    @Body() customerData: CreateCustomerDto,
    @User() user: AuthUserObject,
  ) {
    return this.customerUpdateUseCase.execute(id, user.orgId!, customerData);
  }

  @ApiOperation({
    operationId: CUSTOMER_API_OPERATIONS.DELETE.operationId,
    description: CUSTOMER_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Customer ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteCustomer(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.customerDeleteUseCase.execute(id, user.orgId!);
  }
}
