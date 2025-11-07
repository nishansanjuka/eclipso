export enum ReturnReasonEnum {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CUSTOMER_CHANGED_MIND = 'customer_changed_mind',
  DAMAGED = 'damaged',
  OTHER = 'other',
}

export enum RefundMethodEnum {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  STORE_CREDIT = 'store_credit',
}

export enum ReturnStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}
