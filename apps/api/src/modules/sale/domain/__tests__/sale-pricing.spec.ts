import {
  MAX_AMOUNT_MINOR,
  percentOf,
  priceLine,
  priceSale,
  toDecimal,
  toMinor,
} from '../sale-pricing';

describe('sale-pricing', () => {
  describe('toMinor / toDecimal', () => {
    it('round-trips decimals', () => {
      expect(toMinor('12.34')).toBe(1234);
      expect(toMinor('12.3')).toBe(1230);
      expect(toMinor('12')).toBe(1200);
      expect(toDecimal(1234)).toBe('12.34');
      expect(toDecimal(5)).toBe('0.05');
    });

    it('rejects malformed amounts', () => {
      expect(() => toMinor('1.234')).toThrow();
      expect(() => toMinor('-1')).toThrow();
      expect(() => toMinor('abc')).toThrow();
    });
  });

  describe('percentOf', () => {
    it('rounds half up without float drift', () => {
      expect(percentOf(1000, '10')).toBe(100);
      expect(percentOf(1005, '10')).toBe(101); // 100.5 -> 101
      expect(percentOf(999, '12.5')).toBe(125); // 124.875
      expect(percentOf(1, '50')).toBe(1); // 0.5 -> 1
    });
  });

  describe('priceLine', () => {
    it('prices a plain line', () => {
      expect(priceLine({ unitPriceMinor: 250, qty: 4 })).toEqual({
        grossMinor: 1000,
        discountMinor: 0,
        taxMinor: 0,
        totalMinor: 1000,
      });
    });

    it('applies a percentage discount, then tax on the discounted amount', () => {
      const line = priceLine({
        unitPriceMinor: 1000,
        qty: 2,
        discount: { type: 'percentage', value: '10' },
        tax: { type: 'percentage', value: '8' },
      });
      expect(line.grossMinor).toBe(2000);
      expect(line.discountMinor).toBe(200);
      expect(line.taxMinor).toBe(144); // 8% of 1800
      expect(line.totalMinor).toBe(1944);
    });

    it('applies a fixed discount per line and a fixed tax', () => {
      const line = priceLine({
        unitPriceMinor: 500,
        qty: 2,
        discount: { type: 'fixed', value: '1.50' },
        tax: { type: 'fixed', value: '0.25' },
      });
      expect(line.discountMinor).toBe(150);
      expect(line.taxMinor).toBe(25);
      expect(line.totalMinor).toBe(875);
    });

    it('never lets a discount exceed the line', () => {
      const line = priceLine({
        unitPriceMinor: 100,
        qty: 1,
        discount: { type: 'fixed', value: '50' },
      });
      expect(line.discountMinor).toBe(100);
      expect(line.totalMinor).toBe(0);
    });

    it('rejects bad quantities and prices', () => {
      expect(() => priceLine({ unitPriceMinor: 100, qty: 0 })).toThrow();
      expect(() => priceLine({ unitPriceMinor: 1.5, qty: 1 })).toThrow();
      expect(() => priceLine({ unitPriceMinor: -1, qty: 1 })).toThrow();
    });
  });

  describe('priceSale', () => {
    it('sums lines', () => {
      const sale = priceSale([
        { unitPriceMinor: 1000, qty: 1 },
        {
          unitPriceMinor: 200,
          qty: 3,
          discount: { type: 'percentage', value: '50' },
        },
      ]);
      expect(sale.subTotalMinor).toBe(1600);
      expect(sale.totalDiscountMinor).toBe(300);
      expect(sale.totalMinor).toBe(1300);
    });

    it('rejects totals beyond numeric(10,2)', () => {
      expect(() =>
        priceSale([{ unitPriceMinor: MAX_AMOUNT_MINOR, qty: 2 }]),
      ).toThrow('too large');
    });
  });
});
