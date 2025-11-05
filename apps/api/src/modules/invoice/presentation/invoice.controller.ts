import { Body, Controller, Get, Param } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { InvoiceCalculateUsecase } from '../application/invoice-calculate.usecase';
import { INVOICE_API_OPERATIONS } from '../constants/api-operations';
import { InvoiceGetUsecase } from '../application/invoice-get.usecase';

@ApiTags('Invoice')
@Controller('invoice')
export class InvoicesController {
  constructor(
    private readonly invoiceCalculateUsecase: InvoiceCalculateUsecase,
    private readonly invoiceGetUsecase: InvoiceGetUsecase,
  ) {}

  @ApiOperation({
    operationId: INVOICE_API_OPERATIONS.GET.operationId,
    description: INVOICE_API_OPERATIONS.GET.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @Get(':id')
  @CatchEntityErrors()
  getInvoice(@User() user: AuthUserObject, @Param('id') orderId: string) {
    return this.invoiceGetUsecase.execute(orderId, user.orgId!);
  }

  @ApiOperation({
    operationId: INVOICE_API_OPERATIONS.CALCULATE.operationId,
    description: INVOICE_API_OPERATIONS.CALCULATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @Get('calculate/:id')
  @CatchEntityErrors()
  calculateInvoice(@User() user: AuthUserObject, @Param('id') orderId: string) {
    return this.invoiceCalculateUsecase.execute(orderId, user.orgId!);
  }
}
