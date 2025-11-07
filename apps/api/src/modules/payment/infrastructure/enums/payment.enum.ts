export enum PaymentMethodEnum {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_PAYMENT = 'mobile_payment',
  CHECK = 'check',
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
