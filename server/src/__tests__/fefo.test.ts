import { dbStore, roundMoney } from '../services/dbStore';

describe('FEFO (First-Expired, First-Out) Inventory Algorithm', () => {
  beforeEach(() => {
    // Reset in-memory test data
    dbStore.medications = [];
    dbStore.batches = [];
    dbStore.sales = [];
    dbStore.stockMovements = [];
    dbStore.stockAlerts = [];
  });

  it('correctly rounds currency amounts to 2 decimal places', () => {
    expect(roundMoney(10.126)).toBe(10.13);
    expect(roundMoney(10.124)).toBe(10.12);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('skips expired batches and selects earliest-expiring valid batches first', async () => {
    const medId = '660000000000000000000001';
    const now = new Date();

    const expiredDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const earlyValidDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days ahead
    const lateValidDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    dbStore.medications.push({
      _id: medId,
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      category: 'Antibiotics',
      manufacturer: 'Cipla Ltd',
      reorderThreshold: 10,
      isActive: true,
    });

    // Batch 1: Expired (should be skipped!)
    dbStore.batches.push({
      _id: 'batch-expired',
      medicationId: medId,
      batchNo: 'EXP-001',
      expiryDate: expiredDate,
      quantityInStock: 50,
      sellingPrice: 10,
      status: 'active',
    });

    // Batch 2: Later valid date
    dbStore.batches.push({
      _id: 'batch-later',
      medicationId: medId,
      batchNo: 'VALID-LATER',
      expiryDate: lateValidDate,
      quantityInStock: 40,
      sellingPrice: 12,
      status: 'active',
    });

    // Batch 3: Earliest valid date
    dbStore.batches.push({
      _id: 'batch-early',
      medicationId: medId,
      batchNo: 'VALID-EARLY',
      expiryDate: earlyValidDate,
      quantityInStock: 20,
      sellingPrice: 12,
      status: 'active',
    });

    // Request 25 units: should take 20 from VALID-EARLY, 5 from VALID-LATER, and 0 from EXP-001
    const result = await dbStore.processCheckout({
      cashierId: 'cashier-test-id',
      customerName: 'Test Patient',
      items: [{ medicationId: medId, quantity: 25 }],
      paymentMode: 'Cash',
    });

    expect(result.sale).toBeDefined();
    expect(result.sale.items).toHaveLength(2);

    // First deducted batch must be the earliest valid batch
    expect(result.sale.items[0].batchNo).toBe('VALID-EARLY');
    expect(result.sale.items[0].quantity).toBe(20);

    // Remaining 5 deducted from the later valid batch
    expect(result.sale.items[1].batchNo).toBe('VALID-LATER');
    expect(result.sale.items[1].quantity).toBe(5);

    // Verify inventory state
    const earlyBatch = dbStore.batches.find((b) => b._id === 'batch-early');
    const laterBatch = dbStore.batches.find((b) => b._id === 'batch-later');
    const expiredBatch = dbStore.batches.find((b) => b._id === 'batch-expired');

    expect(earlyBatch?.quantityInStock).toBe(0);
    expect(earlyBatch?.status).toBe('depleted');
    expect(laterBatch?.quantityInStock).toBe(35);
    expect(expiredBatch?.quantityInStock).toBe(50); // Untouched!
  });

  it('prevents overdraft when requested quantity exceeds available unexpired stock', async () => {
    const medId = '660000000000000000000002';
    const now = new Date();

    dbStore.medications.push({
      _id: medId,
      name: 'Paracetamol 650mg',
      genericName: 'Paracetamol',
      category: 'Painkillers',
      manufacturer: 'Micro Labs',
      reorderThreshold: 10,
      isActive: true,
    });

    dbStore.batches.push({
      _id: 'batch-dolo',
      medicationId: medId,
      batchNo: 'DOLO-10',
      expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      quantityInStock: 10,
      sellingPrice: 30,
      status: 'active',
    });

    await expect(
      dbStore.processCheckout({
        cashierId: 'cashier-test-id',
        items: [{ medicationId: medId, quantity: 15 }], // 15 requested, only 10 available
        paymentMode: 'Cash',
      })
    ).rejects.toThrow(/Insufficient valid/);

    // Verify stock was not deducted
    const batch = dbStore.batches.find((b) => b._id === 'batch-dolo');
    expect(batch?.quantityInStock).toBe(10);
  });
});
