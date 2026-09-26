import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderCreateUsecase } from '../order.create.usecase';
import { OrderUpdateUsecase } from '../order.update.usecase';
import { OrderDeleteUsecase } from '../order.delete.usecase';
import { OrderReceiveUsecase } from '../order.receive.usecase';
import { OrderItemCreateUsecase } from '../order-item.create.usecase';
import { OrderItemUpdateUsecase } from '../order-item.update.usecase';
import { OrderItemDeleteUsecase } from '../order-item.delete.usecase';
import { OrderItemTaxRecordUpdateUsecase } from '../order-item-tax.usercase';

const BIZ = 'business-1';
const ORDER = '11111111-1111-4111-8111-111111111111';
const SUPPLIER = '22222222-2222-4222-8222-222222222222';
const PRODUCT = '33333333-3333-4333-8333-333333333333';
const ITEM = '44444444-4444-4444-8444-444444444444';
const TAX = '55555555-5555-4555-8555-555555555555';
const FUTURE = new Date(Date.now() + 86_400_000).toISOString();

const draft = {
  id: ORDER,
  status: 'draft',
  supplierId: SUPPLIER,
  invoiceId: 'inv-1',
};

describe('order workflow', () => {
  let wf: Record<string, jest.Mock>;
  let inventory: Record<string, jest.Mock>;

  beforeEach(() => {
    wf = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      lockOrder: jest.fn().mockResolvedValue(draft),
      lockOrderOfItem: jest.fn().mockResolvedValue(draft),
      supplierInBusiness: jest.fn().mockResolvedValue(true),
      taxInBusiness: jest.fn().mockResolvedValue(true),
      discountInBusiness: jest.fn().mockResolvedValue(true),
      loadProduct: jest
        .fn()
        .mockResolvedValue({ id: PRODUCT, supplierId: SUPPLIER }),
      orderHasProduct: jest.fn().mockResolvedValue(false),
      itemsOf: jest.fn().mockResolvedValue([]),
      insertOrderWithInvoice: jest.fn((_tx, v) =>
        Promise.resolve({ id: ORDER, ...v }),
      ),
      updateOrder: jest.fn((_tx, id, v) => Promise.resolve({ id, ...v })),
      deleteOrderWithInvoice: jest.fn(),
      insertItem: jest.fn((_tx, v) => Promise.resolve({ id: ITEM, ...v })),
      updateItem: jest.fn((_tx, id, v) => Promise.resolve({ id, ...v })),
      deleteItem: jest.fn(),
      recomputeTotal: jest.fn(),
      addItemTax: jest.fn(),
      removeItemTax: jest.fn(),
    };
    inventory = {
      restock: jest.fn().mockResolvedValue(true),
      insertMovements: jest.fn((_tx, v) => Promise.resolve(v)),
    };
  });

  describe('create', () => {
    const run = (data: any) =>
      new OrderCreateUsecase(wf as any).execute(BIZ, data);

    it('forces draft and a zero total, ignoring client status, total and invoice', async () => {
      const order: any = await run({
        supplierId: SUPPLIER,
        expectedDate: FUTURE,
        status: 'received',
        totalAmount: 999999,
        invoiceId: 'someone-elses',
        businessId: 'other-business',
      });
      expect(order).toMatchObject({
        businessId: BIZ,
        supplierId: SUPPLIER,
        status: 'draft',
        totalAmount: 0,
      });
      expect(order.invoiceId).toBeUndefined();
    });

    it('refuses a supplier from another business', async () => {
      wf.supplierInBusiness.mockResolvedValue(false);
      await expect(
        run({ supplierId: SUPPLIER, expectedDate: FUTURE }),
      ).rejects.toThrow(NotFoundException);
      expect(wf.insertOrderWithInvoice).not.toHaveBeenCalled();
    });

    it('checks "in the future" at request time', async () => {
      await expect(
        run({ supplierId: SUPPLIER, expectedDate: '2000-01-01' }),
      ).rejects.toThrow(/in the future/);
    });
  });

  describe('update', () => {
    const run = (data: any) =>
      new OrderUpdateUsecase(wf as any).execute(ORDER, BIZ, data);

    it('only sets the date and cancel; never business, total, invoice or received', async () => {
      await run({
        expectedDate: FUTURE,
        status: 'cancel',
        businessId: 'other',
        totalAmount: 1,
        invoiceId: 'x',
      });
      const set = wf.updateOrder.mock.calls[0][2];
      expect(Object.keys(set).sort()).toEqual(['expectedDate', 'status']);
      expect(set.status).toBe('cancel');
    });

    it('cannot mark an order received through update', async () => {
      await expect(run({ status: 'received' })).rejects.toThrow(
        /receive endpoint/,
      );
      expect(wf.updateOrder).not.toHaveBeenCalled();
    });

    it("cannot touch another business's order, or a non-draft one", async () => {
      wf.lockOrder.mockResolvedValue(undefined);
      await expect(run({ expectedDate: FUTURE })).rejects.toThrow(
        NotFoundException,
      );

      wf.lockOrder.mockResolvedValue({ ...draft, status: 'received' });
      await expect(run({ expectedDate: FUTURE })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    const run = () => new OrderDeleteUsecase(wf as any).execute(ORDER, BIZ);

    it('deletes a draft and its invoice', async () => {
      await run();
      expect(wf.deleteOrderWithInvoice).toHaveBeenCalledWith(
        'tx',
        ORDER,
        'inv-1',
      );
    });

    it('keeps received orders as history', async () => {
      wf.lockOrder.mockResolvedValue({ ...draft, status: 'received' });
      await expect(run()).rejects.toThrow(ConflictException);
    });

    it('404s for another business', async () => {
      wf.lockOrder.mockResolvedValue(undefined);
      await expect(run()).rejects.toThrow(NotFoundException);
    });
  });

  describe('receive', () => {
    const run = () =>
      new OrderReceiveUsecase(wf as any, inventory as any).execute(ORDER, BIZ);

    it('adds stock and PURCHASE ledger entries once, then marks the order received', async () => {
      wf.itemsOf.mockResolvedValue([
        { productId: 'p2', qty: 5 },
        { productId: 'p1', qty: 2 },
        { productId: 'p2', qty: 1 },
      ]);
      const result: any = await run();

      expect(inventory.restock.mock.calls.map((c) => [c[2], c[3]])).toEqual([
        ['p1', 2],
        ['p2', 6],
      ]);
      expect(inventory.insertMovements.mock.calls[0][1]).toEqual(
        expect.arrayContaining([
          { productId: 'p1', orderId: ORDER, qty: 2, movementType: 'purchase' },
          { productId: 'p2', orderId: ORDER, qty: 6, movementType: 'purchase' },
        ]),
      );
      expect(result.order.status).toBe('received');
    });

    it('cannot be received twice', async () => {
      wf.lockOrder.mockResolvedValue({ ...draft, status: 'received' });
      await expect(run()).rejects.toThrow(ConflictException);
      expect(inventory.restock).not.toHaveBeenCalled();
    });

    it('refuses an empty order and other tenants orders', async () => {
      await expect(run()).rejects.toThrow(BadRequestException);
      wf.lockOrder.mockResolvedValue(undefined);
      await expect(run()).rejects.toThrow(NotFoundException);
    });

    it('a failed restock aborts before the order is marked received', async () => {
      wf.itemsOf.mockResolvedValue([{ productId: 'p1', qty: 1 }]);
      inventory.restock.mockResolvedValue(false);
      await expect(run()).rejects.toThrow(NotFoundException);
      expect(wf.updateOrder).not.toHaveBeenCalled();
    });
  });

  describe('order items', () => {
    const create = (data: any) =>
      new OrderItemCreateUsecase(wf as any).execute(BIZ, data);
    const body = { orderId: ORDER, productId: PRODUCT, qty: 3, price: 250 };

    it('adds a line and recomputes the total, without touching stock or the ledger', async () => {
      await create(body);
      expect(wf.insertItem).toHaveBeenCalledWith('tx', {
        orderId: ORDER,
        productId: PRODUCT,
        qty: 3,
        price: 250,
      });
      expect(wf.recomputeTotal).toHaveBeenCalledWith('tx', ORDER);
      expect(inventory.restock).not.toHaveBeenCalled();
    });

    it('proves the order is the callers before adding to it', async () => {
      wf.lockOrder.mockResolvedValue(undefined);
      await expect(create(body)).rejects.toThrow(NotFoundException);
      expect(wf.insertItem).not.toHaveBeenCalled();
    });

    it('404s (not a crash) for a product in another business', async () => {
      wf.loadProduct.mockResolvedValue(undefined);
      await expect(create(body)).rejects.toThrow(NotFoundException);
    });

    it('rejects a product of a different supplier, duplicates, and non-draft orders', async () => {
      wf.loadProduct.mockResolvedValue({ id: PRODUCT, supplierId: 'other' });
      await expect(create(body)).rejects.toThrow(/supplier/);

      wf.loadProduct.mockResolvedValue({ id: PRODUCT, supplierId: SUPPLIER });
      wf.orderHasProduct.mockResolvedValue(true);
      await expect(create(body)).rejects.toThrow(ConflictException);

      wf.orderHasProduct.mockResolvedValue(false);
      wf.lockOrder.mockResolvedValue({ ...draft, status: 'received' });
      await expect(create(body)).rejects.toThrow(ConflictException);
    });

    it('validates quantity and price', async () => {
      await expect(create({ ...body, qty: 0 })).rejects.toThrow(/at least 1/);
      await expect(create({ ...body, qty: 1.5 })).rejects.toThrow(
        /whole number/,
      );
      await expect(create({ ...body, price: -1 })).rejects.toThrow(/negative/);
    });

    it('update only sets qty/price, scoped through the order', async () => {
      await new OrderItemUpdateUsecase(wf as any).execute(ITEM, BIZ, {
        qty: 9,
        price: 5,
        orderId: 'move-me',
        productId: 'swap',
      } as any);
      expect(wf.lockOrderOfItem).toHaveBeenCalledWith('tx', BIZ, ITEM);
      expect(wf.updateItem).toHaveBeenCalledWith('tx', ITEM, {
        qty: 9,
        price: 5,
      });
      expect(wf.recomputeTotal).toHaveBeenCalled();
    });

    it('update and delete 404 for an item of another business, and refuse non-draft orders', async () => {
      wf.lockOrderOfItem.mockResolvedValue(undefined);
      await expect(
        new OrderItemUpdateUsecase(wf as any).execute(ITEM, BIZ, { qty: 1 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        new OrderItemDeleteUsecase(wf as any).execute(ITEM, BIZ),
      ).rejects.toThrow(NotFoundException);

      wf.lockOrderOfItem.mockResolvedValue({ ...draft, status: 'received' });
      await expect(
        new OrderItemDeleteUsecase(wf as any).execute(ITEM, BIZ),
      ).rejects.toThrow(ConflictException);
      expect(wf.deleteItem).not.toHaveBeenCalled();
    });

    it('delete removes the line and recomputes the total, with no ledger writes', async () => {
      await new OrderItemDeleteUsecase(wf as any).execute(ITEM, BIZ);
      expect(wf.deleteItem).toHaveBeenCalledWith('tx', ITEM);
      expect(wf.recomputeTotal).toHaveBeenCalledWith('tx', ORDER);
    });
  });

  describe('order item taxes', () => {
    const uc = () => new OrderItemTaxRecordUpdateUsecase(wf as any);

    it('refuses a tax from another business', async () => {
      wf.taxInBusiness.mockResolvedValue(false);
      await expect(
        uc().add({ orderItemId: ITEM, taxId: TAX }, BIZ),
      ).rejects.toThrow(/Tax not found/);
      expect(wf.addItemTax).not.toHaveBeenCalled();
    });

    it('removes only the requested tax', async () => {
      await uc().remove({ orderItemId: ITEM, taxId: TAX }, BIZ);
      expect(wf.removeItemTax).toHaveBeenCalledWith('tx', ITEM, TAX);
    });
  });
});
