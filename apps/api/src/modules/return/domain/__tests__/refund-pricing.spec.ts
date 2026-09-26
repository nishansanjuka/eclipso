import {
  cumulativeRefundMinor,
  lineTotalMinor,
  refundForReturnMinor,
} from '../refund-pricing';

// 3 x 10.00, 10% line discount (3.00), 8% tax on 27.00 (2.16) => 29.16
const line = {
  price: '10.00',
  qty: 3,
  discountAmount: '3.00',
  taxAmount: '2.16',
};

describe('refund-pricing', () => {
  it('uses what was paid: price*qty - discount + tax', () => {
    expect(lineTotalMinor(line)).toBe(2916);
  });

  it('refunds the full paid amount when every unit is returned', () => {
    expect(cumulativeRefundMinor(line, 3)).toBe(2916);
  });

  it('pro-rates per unit', () => {
    expect(cumulativeRefundMinor(line, 1)).toBe(972);
  });

  it('never drifts: partial returns add up to exactly the line total', () => {
    const odd = {
      price: '3.33',
      qty: 3,
      discountAmount: '0.00',
      taxAmount: '0.01',
    };
    const a = refundForReturnMinor(odd, 0, 1);
    const b = refundForReturnMinor(odd, 1, 1);
    const c = refundForReturnMinor(odd, 2, 1);
    expect(a + b + c).toBe(lineTotalMinor(odd));
  });

  it('same total whether returned at once or in pieces', () => {
    const once = refundForReturnMinor(line, 0, 3);
    const pieces =
      refundForReturnMinor(line, 0, 1) + refundForReturnMinor(line, 1, 2);
    expect(pieces).toBe(once);
  });

  it('is zero for zero units', () => {
    expect(cumulativeRefundMinor(line, 0)).toBe(0);
  });
});
