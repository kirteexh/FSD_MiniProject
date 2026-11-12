import { getSeedData } from '../seed/seedData.js';
import { getIsDbConnected } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { MedicationModel } from '../models/Medication.js';
import { InventoryBatchModel } from '../models/InventoryBatch.js';
import { SaleModel } from '../models/Sale.js';
import { StockAlertModel } from '../models/StockAlert.js';
import { SupplierModel } from '../models/Supplier.js';
import { PurchaseModel } from '../models/Purchase.js';
import { StockMovementModel } from '../models/StockMovement.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { SaleReturnModel } from '../models/SaleReturn.js';
import { SettingsModel } from '../models/Settings.js';

// Financial calculation helper to prevent floating-point rounding errors
export const roundMoney = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Async Mutex for in-memory atomicity during concurrent checkout operations
class AsyncLock {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };
      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

const checkoutMutex = new AsyncLock();

// In-Memory Hybrid Store
class InMemoryStore {
  users: any[];
  suppliers: any[];
  medications: any[];
  batches: any[];
  sales: any[];
  purchases: any[];
  stockAlerts: any[];
  stockMovements: any[];
  auditLogs: any[];
  saleReturns: any[];
  settings: any;

  constructor() {
    const seed = getSeedData();
    this.users = seed.users;
    this.suppliers = seed.suppliers;
    this.medications = seed.medications;
    this.batches = seed.batches;
    this.sales = seed.sales;
    this.purchases = seed.purchases;
    this.stockAlerts = seed.stockAlerts;
    this.stockMovements = seed.stockMovements;
    this.auditLogs = seed.auditLogs;
    this.saleReturns = [];
    this.settings = seed.settings;
  }

  // Helper ID generator
  genId() {
    return '66' + Math.random().toString(16).substring(2, 10).padEnd(22, '0');
  }

  // USERS
  async findUserByEmail(email: string) {
    if (getIsDbConnected()) {
      return await UserModel.findOne({ email: email.toLowerCase() });
    }
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id: string) {
    if (getIsDbConnected()) {
      return await UserModel.findById(id);
    }
    return this.users.find((u) => u._id.toString() === id.toString());
  }

  async getUsers() {
    if (getIsDbConnected()) {
      return await UserModel.find().select('-passwordHash').sort({ createdAt: -1 });
    }
    return this.users.map(({ passwordHash, ...rest }) => rest);
  }

  async createUser(userData: any) {
    if (getIsDbConnected()) {
      const user = new UserModel(userData);
      return await user.save();
    }
    const newUser = {
      _id: this.genId(),
      ...userData,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.unshift(newUser);
    return newUser;
  }

  async updateUser(id: string, updates: any) {
    if (getIsDbConnected()) {
      return await UserModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const index = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...updates, updatedAt: new Date() };
    return this.users[index];
  }

  async deleteUser(id: string) {
    if (getIsDbConnected()) {
      return await UserModel.findByIdAndDelete(id);
    }
    const index = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  // MEDICATIONS & BATCHES
  async getMedications(filter: { search?: string; category?: string; status?: string }) {
    let meds: any[] = [];
    let batches: any[] = [];
    const settings = await this.getSettings();
    const expiryWindowDays = settings?.expiryAlertDays || 60;
    const defaultReorder = settings?.defaultReorderThreshold || 20;

    if (getIsDbConnected()) {
      meds = await MedicationModel.find({ isActive: true }).lean();
      batches = await InventoryBatchModel.find().lean();
    } else {
      meds = this.medications.filter((m) => m.isActive);
      batches = this.batches;
    }

    const now = new Date();
    const alertThresholdDate = new Date(now.getTime() + expiryWindowDays * 24 * 60 * 60 * 1000);

    // Combine medication with batch aggregates
    let result = meds.map((med) => {
      const medBatches = batches.filter(
        (b) => b.medicationId.toString() === med._id.toString() && b.status !== 'depleted'
      );
      const totalStock = medBatches.reduce((sum, b) => sum + (b.quantityInStock || 0), 0);
      const minPrice = medBatches.length > 0 ? Math.min(...medBatches.map((b) => b.sellingPrice)) : 0;
      const maxPrice = medBatches.length > 0 ? Math.max(...medBatches.map((b) => b.sellingPrice)) : 0;
      const latestBatch = medBatches[0];

      // Check status
      let stockStatus = 'In Stock';
      const hasExpired = medBatches.some((b) => new Date(b.expiryDate) < now && (b.quantityInStock || 0) > 0);
      const hasExpiringSoon = medBatches.some((b) => {
        const exp = new Date(b.expiryDate);
        return exp >= now && exp <= alertThresholdDate && (b.quantityInStock || 0) > 0;
      });

      const reorderLevel = med.reorderThreshold ?? defaultReorder;

      if (totalStock === 0) {
        stockStatus = 'Out of Stock';
      } else if (hasExpired && medBatches.every((b) => new Date(b.expiryDate) < now)) {
        stockStatus = 'Expired';
      } else if (totalStock <= reorderLevel) {
        stockStatus = 'Low Stock';
      } else if (hasExpiringSoon) {
        stockStatus = 'Expiring Soon';
      }

      return {
        ...med,
        availableQuantity: totalStock,
        pricePerUnit: maxPrice || minPrice || 0,
        purchasePrice: latestBatch ? latestBatch.purchasePrice : 0,
        batchNumber: latestBatch ? latestBatch.batchNo : 'N/A',
        expiryDate: latestBatch ? latestBatch.expiryDate : null,
        stockStatus,
        batches: medBatches,
      };
    });

    // Apply filters
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.manufacturer.toLowerCase().includes(q) ||
          (m.barcode && m.barcode.toLowerCase().includes(q)) ||
          (m.batchNumber && m.batchNumber.toLowerCase().includes(q))
      );
    }

    if (filter.category && filter.category !== 'All') {
      result = result.filter((m) => m.category.toLowerCase() === filter.category?.toLowerCase());
    }

    if (filter.status && filter.status !== 'All') {
      result = result.filter((m) => m.stockStatus.toLowerCase() === filter.status?.toLowerCase());
    }

    return result;
  }

  async getMedicationById(id: string) {
    let med: any = null;
    let batches: any[] = [];
    let movements: any[] = [];

    if (getIsDbConnected()) {
      med = await MedicationModel.findById(id).lean();
      if (!med) return null;
      batches = await InventoryBatchModel.find({ medicationId: id }).populate('supplierId').lean();
      movements = await StockMovementModel.find({ medicationId: id }).sort({ createdAt: -1 }).limit(15).lean();
    } else {
      med = this.medications.find((m) => m._id.toString() === id.toString());
      if (!med) return null;
      batches = this.batches.filter((b) => b.medicationId.toString() === id.toString());
      movements = this.stockMovements
        .filter((sm) => sm.medicationId.toString() === id.toString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const totalStock = batches
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + (b.quantityInStock || 0), 0);

    return {
      ...med,
      availableQuantity: totalStock,
      batches,
      movements,
    };
  }

  async getMedicationByBarcode(code: string) {
    const meds = await this.getMedications({ search: code });
    const exact = meds.find((m) => m.barcode === code);
    return exact || meds[0] || null;
  }

  async createMedication(medData: any, initialBatch?: any, userId?: string) {
    let newMed: any = null;
    let newBatch: any = null;

    if (getIsDbConnected()) {
      newMed = new MedicationModel(medData);
      await newMed.save();

      if (initialBatch && initialBatch.batchNo) {
        newBatch = new InventoryBatchModel({
          ...initialBatch,
          medicationId: newMed._id,
        });
        await newBatch.save();

        await new StockMovementModel({
          medicationId: newMed._id,
          batchId: newBatch._id,
          movementType: 'MANUAL_ADJUSTMENT',
          quantity: initialBatch.quantityInStock,
          balanceBefore: 0,
          balanceAfter: initialBatch.quantityInStock,
          performedBy: userId || '66a100000000000000000001',
          reason: 'Initial stock on medication creation',
        }).save();
      }
    } else {
      const medId = this.genId();
      newMed = {
        _id: medId,
        ...medData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.medications.unshift(newMed);

      if (initialBatch && initialBatch.batchNo) {
        const batchId = this.genId();
        newBatch = {
          _id: batchId,
          medicationId: medId,
          ...initialBatch,
          status: 'active',
          receivedAt: new Date(),
          createdAt: new Date(),
        };
        this.batches.unshift(newBatch);

        this.stockMovements.unshift({
          _id: this.genId(),
          medicationId: medId,
          batchId: batchId,
          movementType: 'MANUAL_ADJUSTMENT',
          quantity: initialBatch.quantityInStock,
          balanceBefore: 0,
          balanceAfter: initialBatch.quantityInStock,
          performedBy: userId || '66a100000000000000000001',
          reason: 'Initial stock on medication creation',
          createdAt: new Date(),
        });
      }
    }

    return { medication: newMed, batch: newBatch };
  }

  async updateMedication(id: string, updates: any) {
    if (getIsDbConnected()) {
      return await MedicationModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const index = this.medications.findIndex((m) => m._id.toString() === id.toString());
    if (index === -1) return null;
    this.medications[index] = { ...this.medications[index], ...updates, updatedAt: new Date() };
    return this.medications[index];
  }

  async archiveMedication(id: string) {
    return await this.updateMedication(id, { isActive: false });
  }

  async addBatch(batchData: any, userId?: string) {
    let newBatch: any = null;
    if (getIsDbConnected()) {
      newBatch = new InventoryBatchModel(batchData);
      await newBatch.save();

      await new StockMovementModel({
        medicationId: batchData.medicationId,
        batchId: newBatch._id,
        movementType: 'PURCHASE_RECEIPT',
        quantity: batchData.quantityInStock,
        balanceBefore: 0,
        balanceAfter: batchData.quantityInStock,
        performedBy: userId || '66a100000000000000000001',
        reason: 'New inventory batch added',
      }).save();
    } else {
      const batchId = this.genId();
      newBatch = {
        _id: batchId,
        ...batchData,
        status: 'active',
        receivedAt: new Date(),
        createdAt: new Date(),
      };
      this.batches.unshift(newBatch);

      this.stockMovements.unshift({
        _id: this.genId(),
        medicationId: batchData.medicationId,
        batchId: batchId,
        movementType: 'PURCHASE_RECEIPT',
        quantity: batchData.quantityInStock,
        balanceBefore: 0,
        balanceAfter: batchData.quantityInStock,
        performedBy: userId || '66a100000000000000000001',
        reason: 'New inventory batch added',
        createdAt: new Date(),
      });
    }
    return newBatch;
  }

  async adjustStock(
    medicationId: string,
    batchId: string,
    quantityChange: number,
    reason: string,
    userId: string
  ) {
    if (!userId) {
      throw new Error('Authenticated user ID required for stock adjustment audit.');
    }

    let updatedBatch: any = null;

    if (getIsDbConnected()) {
      const batch = await InventoryBatchModel.findById(batchId);
      if (!batch) throw new Error('Batch not found');
      const balanceBefore = batch.quantityInStock;
      const newBalance = Math.max(0, balanceBefore + quantityChange);
      batch.quantityInStock = newBalance;
      if (batch.quantityInStock === 0) batch.status = 'depleted';
      await batch.save();
      updatedBatch = batch;

      await new StockMovementModel({
        medicationId,
        batchId,
        movementType: quantityChange > 0 ? 'MANUAL_ADJUSTMENT' : 'DAMAGE_DISPOSAL',
        quantity: quantityChange,
        balanceBefore,
        balanceAfter: newBalance,
        performedBy: userId,
        reason,
      }).save();
    } else {
      const batch = this.batches.find((b) => b._id.toString() === batchId.toString());
      if (!batch) throw new Error('Batch not found');
      const balanceBefore = batch.quantityInStock;
      const newBalance = Math.max(0, balanceBefore + quantityChange);
      batch.quantityInStock = newBalance;
      if (batch.quantityInStock === 0) batch.status = 'depleted';
      updatedBatch = batch;

      this.stockMovements.unshift({
        _id: this.genId(),
        medicationId,
        batchId,
        movementType: quantityChange > 0 ? 'MANUAL_ADJUSTMENT' : 'DAMAGE_DISPOSAL',
        quantity: quantityChange,
        balanceBefore,
        balanceAfter: newBalance,
        performedBy: userId,
        reason,
        createdAt: new Date(),
      });
    }

    return updatedBatch;
  }

  // BILLING & CHECKOUT (RIGOROUS FEFO ALGORITHM & ATOMIC CONCURRENCY)
  async processCheckout(saleData: {
    cashierId: string;
    customerName?: string;
    customerPhone?: string;
    items: { medicationId: string; quantity: number }[];
    discount?: number;
    paymentMode: 'Cash' | 'Card' | 'UPI';
    notes?: string;
    prescription?: {
      prescriptionNumber?: string;
      doctorName?: string;
      patientName?: string;
    };
  }) {
    if (!saleData.cashierId) {
      throw new Error('Cashier identification required for sale transaction.');
    }

    // Acquire lock to guarantee atomic stock deduction and prevent concurrent overdraft
    const releaseLock = await checkoutMutex.acquire();

    try {
      const now = new Date();
      const saleItems: any[] = [];
      let subtotal = 0;
      const lowStockAlertsToTrigger: any[] = [];
      const settings = await this.getSettings();

      // Pre-check stock across valid (non-expired) batches before modifying any inventory
      for (const item of saleData.items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Item quantity must be greater than zero.');
        }

        let med: any = null;
        let validBatches: any[] = [];

        if (getIsDbConnected()) {
          med = await MedicationModel.findById(item.medicationId);
          // FEFO rule: Only fetch non-expired batches (expiryDate > now), sorted ascending by expiryDate
          validBatches = await InventoryBatchModel.find({
            medicationId: item.medicationId,
            status: 'active',
            quantityInStock: { $gt: 0 },
            expiryDate: { $gt: now },
          }).sort({ expiryDate: 1 });
        } else {
          med = this.medications.find((m) => m._id.toString() === item.medicationId.toString());
          validBatches = this.batches
            .filter(
              (b) =>
                b.medicationId.toString() === item.medicationId.toString() &&
                b.status === 'active' &&
                b.quantityInStock > 0 &&
                new Date(b.expiryDate) > now
            )
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        }

        if (!med) {
          throw new Error(`Medication not found: ${item.medicationId}`);
        }

        const availableUnexpiredStock = validBatches.reduce((acc, b) => acc + b.quantityInStock, 0);
        if (availableUnexpiredStock < item.quantity) {
          throw new Error(
            `Insufficient valid (unexpired) stock for ${med.name}. Requested: ${item.quantity}, Available: ${availableUnexpiredStock}`
          );
        }

        // Deduct from earliest expiring batches first
        let needed = item.quantity;
        for (const batch of validBatches) {
          if (needed <= 0) break;
          const take = Math.min(batch.quantityInStock, needed);
          const balanceBefore = batch.quantityInStock;
          batch.quantityInStock -= take;
          if (batch.quantityInStock === 0) batch.status = 'depleted';

          if (getIsDbConnected()) {
            await batch.save();
          }

          const itemSubtotal = roundMoney(take * batch.sellingPrice);
          subtotal = roundMoney(subtotal + itemSubtotal);

          saleItems.push({
            medicationId: med._id,
            batchId: batch._id,
            medicationName: med.name,
            batchNo: batch.batchNo,
            expiryDate: batch.expiryDate,
            quantity: take,
            unitPrice: batch.sellingPrice,
            subtotal: itemSubtotal,
          });

          // Record stock movement
          const movementData = {
            medicationId: med._id,
            batchId: batch._id,
            movementType: 'SALE',
            quantity: -take,
            balanceBefore,
            balanceAfter: batch.quantityInStock,
            performedBy: saleData.cashierId,
            reason: `POS sale to ${saleData.customerName || 'Walk-in Customer'}`,
            createdAt: new Date(),
          };

          if (getIsDbConnected()) {
            await new StockMovementModel(movementData).save();
          } else {
            this.stockMovements.unshift({ _id: this.genId(), ...movementData });
          }

          needed -= take;
        }

        // Check if total stock is now below reorder threshold
        const remainingStock = availableUnexpiredStock - item.quantity;
        const reorderLevel = med.reorderThreshold ?? settings?.defaultReorderThreshold ?? 20;
        if (remainingStock <= reorderLevel) {
          lowStockAlertsToTrigger.push({
            medicationId: med._id,
            message: `Low Stock Alert: ${med.name} has only ${remainingStock} units left (Threshold: ${reorderLevel}).`,
            thresholdAtAlert: reorderLevel,
            alertType: remainingStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          });
        }
      }

      const discount = roundMoney(saleData.discount || 0);
      const taxRate = settings?.taxRate ?? 5;
      const taxableAmount = Math.max(0, roundMoney(subtotal - discount));
      const tax = roundMoney((taxableAmount * taxRate) / 100);
      const totalAmount = roundMoney(taxableAmount + tax);

      const count = getIsDbConnected() ? (await SaleModel.countDocuments()) + 1 : this.sales.length + 1;
      const invoicePrefix = settings?.invoicePrefix || 'INV-2026-';
      const invoiceNo = `${invoicePrefix}${count.toString().padStart(4, '0')}`;

      const newSale = {
        invoiceNo,
        cashierId: saleData.cashierId,
        customerName: saleData.customerName || 'Walk-in Customer',
        customerPhone: saleData.customerPhone || 'N/A',
        prescription: saleData.prescription || {},
        items: saleItems,
        subtotal,
        discount,
        tax,
        totalAmount,
        paymentMode: saleData.paymentMode,
        status: 'completed',
        notes: saleData.notes,
        createdAt: new Date(),
      };

      let savedSale: any = null;
      if (getIsDbConnected()) {
        savedSale = new SaleModel(newSale);
        await savedSale.save();
      } else {
        savedSale = { _id: this.genId(), ...newSale };
        this.sales.unshift(savedSale);
      }

      // Trigger low-stock alerts
      for (const alert of lowStockAlertsToTrigger) {
        await this.createAlert(alert);
      }

      return { sale: savedSale, alerts: lowStockAlertsToTrigger };
    } finally {
      releaseLock();
    }
  }

  // SALES HISTORY & RETURNS
  async getSales(filter: { search?: string; status?: string; paymentMode?: string }) {
    let list: any[] = [];
    if (getIsDbConnected()) {
      list = await SaleModel.find().populate('cashierId', 'name email role').sort({ createdAt: -1 }).lean();
    } else {
      list = this.sales.map((s) => {
        const cashier = this.users.find((u) => u._id.toString() === s.cashierId.toString());
        return {
          ...s,
          cashierId: cashier ? { name: cashier.name, email: cashier.email, role: cashier.role } : null,
        };
      });
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.invoiceNo.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.cashierId?.name && s.cashierId.name.toLowerCase().includes(q))
      );
    }

    if (filter.status && filter.status !== 'All') {
      list = list.filter((s) => s.status.toLowerCase() === filter.status?.toLowerCase());
    }

    if (filter.paymentMode && filter.paymentMode !== 'All') {
      list = list.filter((s) => s.paymentMode.toLowerCase() === filter.paymentMode?.toLowerCase());
    }

    return list;
  }

  async getSaleById(id: string) {
    if (getIsDbConnected()) {
      return await SaleModel.findById(id).populate('cashierId', 'name email role').lean();
    }
    const sale = this.sales.find((s) => s._id.toString() === id.toString());
    if (!sale) return null;
    const cashier = this.users.find((u) => u._id.toString() === sale.cashierId.toString());
    return {
      ...sale,
      cashierId: cashier ? { name: cashier.name, email: cashier.email, role: cashier.role } : null,
    };
  }

  async returnSale(
    saleId: string,
    reason: string,
    userId: string,
    returnItems?: { batchId: string; quantity: number }[]
  ) {
    let sale: any = null;
    if (getIsDbConnected()) {
      sale = await SaleModel.findById(saleId);
    } else {
      sale = this.sales.find((s) => s._id.toString() === saleId.toString());
    }
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'returned') throw new Error('Sale has already been completely returned.');

    const now = new Date();
    const itemsToReturn = returnItems && returnItems.length > 0
      ? returnItems
      : sale.items.map((i: any) => ({ batchId: i.batchId.toString(), quantity: i.quantity }));

    let totalRefundAmount = 0;
    const returnedLogItems: any[] = [];

    for (const ret of itemsToReturn) {
      const originalItem = sale.items.find((i: any) => i.batchId.toString() === ret.batchId.toString());
      if (!originalItem) continue;

      const qty = Math.min(ret.quantity, originalItem.quantity);
      if (qty <= 0) continue;

      const refundItemAmount = roundMoney(qty * originalItem.unitPrice);
      totalRefundAmount = roundMoney(totalRefundAmount + refundItemAmount);

      returnedLogItems.push({
        medicationId: originalItem.medicationId,
        batchId: originalItem.batchId,
        medicationName: originalItem.medicationName,
        batchNo: originalItem.batchNo,
        quantity: qty,
        unitPrice: originalItem.unitPrice,
        refundSubtotal: refundItemAmount,
      });

      // Restore stock safely: check if the batch has expired!
      if (getIsDbConnected()) {
        const batch = await InventoryBatchModel.findById(originalItem.batchId);
        if (batch) {
          const balanceBefore = batch.quantityInStock;
          const isExpired = new Date(batch.expiryDate) <= now;
          if (isExpired) {
            // Do NOT restock expired items into active inventory
            batch.status = 'expired';
          } else {
            batch.quantityInStock += qty;
            batch.status = 'active';
          }
          await batch.save();

          await new StockMovementModel({
            medicationId: originalItem.medicationId,
            batchId: originalItem.batchId,
            movementType: 'SALE_RETURN',
            quantity: isExpired ? 0 : qty,
            balanceBefore,
            balanceAfter: batch.quantityInStock,
            performedBy: userId,
            reason: `Returned invoice ${sale.invoiceNo} (${isExpired ? 'EXPIRED: NOT RESTOCKED' : 'Restocked'}): ${reason}`,
          }).save();
        }
      } else {
        const batch = this.batches.find((b) => b._id.toString() === originalItem.batchId.toString());
        if (batch) {
          const balanceBefore = batch.quantityInStock;
          const isExpired = new Date(batch.expiryDate) <= now;
          if (isExpired) {
            batch.status = 'expired';
          } else {
            batch.quantityInStock += qty;
            batch.status = 'active';
          }

          this.stockMovements.unshift({
            _id: this.genId(),
            medicationId: originalItem.medicationId,
            batchId: originalItem.batchId,
            movementType: 'SALE_RETURN',
            quantity: isExpired ? 0 : qty,
            balanceBefore,
            balanceAfter: batch.quantityInStock,
            performedBy: userId,
            reason: `Returned invoice ${sale.invoiceNo} (${isExpired ? 'EXPIRED: NOT RESTOCKED' : 'Restocked'}): ${reason}`,
            createdAt: new Date(),
          });
        }
      }
    }

    sale.status = 'returned';

    if (getIsDbConnected()) {
      await sale.save();
      const ret = new SaleReturnModel({
        returnNo: `RET-${Date.now().toString().slice(-4)}`,
        originalSaleId: sale._id,
        invoiceNo: sale.invoiceNo,
        items: returnedLogItems,
        refundAmount: totalRefundAmount || sale.totalAmount,
        reason,
        processedBy: userId,
      });
      await ret.save();
    } else {
      this.saleReturns.unshift({
        _id: this.genId(),
        returnNo: `RET-${Date.now().toString().slice(-4)}`,
        originalSaleId: sale._id,
        invoiceNo: sale.invoiceNo,
        refundAmount: totalRefundAmount || sale.totalAmount,
        reason,
        processedBy: userId,
        createdAt: new Date(),
      });
    }

    return sale;
  }

  // SUPPLIERS
  async getSuppliers() {
    if (getIsDbConnected()) {
      return await SupplierModel.find().sort({ createdAt: -1 }).lean();
    }
    return this.suppliers;
  }

  async getSupplierById(id: string) {
    let sup: any = null;
    let purchases: any[] = [];
    if (getIsDbConnected()) {
      sup = await SupplierModel.findById(id).lean();
      if (!sup) return null;
      purchases = await PurchaseModel.find({ supplierId: id }).lean();
    } else {
      sup = this.suppliers.find((s) => s._id.toString() === id.toString());
      if (!sup) return null;
      purchases = this.purchases.filter((p) => p.supplierId.toString() === id.toString());
    }
    return { ...sup, purchases };
  }

  async createSupplier(data: any) {
    if (getIsDbConnected()) {
      const s = new SupplierModel(data);
      return await s.save();
    }
    const newSup = { _id: this.genId(), ...data, status: 'active', createdAt: new Date() };
    this.suppliers.unshift(newSup);
    return newSup;
  }

  async updateSupplier(id: string, updates: any) {
    if (getIsDbConnected()) {
      return await SupplierModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const index = this.suppliers.findIndex((s) => s._id.toString() === id.toString());
    if (index === -1) return null;
    this.suppliers[index] = { ...this.suppliers[index], ...updates, updatedAt: new Date() };
    return this.suppliers[index];
  }

  async deleteSupplier(id: string) {
    if (getIsDbConnected()) {
      return await SupplierModel.findByIdAndDelete(id);
    }
    const index = this.suppliers.findIndex((s) => s._id.toString() === id.toString());
    if (index === -1) return false;
    this.suppliers.splice(index, 1);
    return true;
  }

  // PURCHASES & STOCK RECEIVING
  async getPurchases() {
    if (getIsDbConnected()) {
      return await PurchaseModel.find()
        .populate('supplierId')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();
    }
    return this.purchases.map((p) => {
      const supplier = this.suppliers.find((s) => s._id.toString() === p.supplierId.toString());
      const creator = this.users.find((u) => u._id.toString() === p.createdBy.toString());
      return {
        ...p,
        supplierId: supplier,
        createdBy: creator ? { name: creator.name, email: creator.email } : null,
      };
    });
  }

  async createPurchase(purchaseData: any, userId: string) {
    const count = getIsDbConnected()
      ? (await PurchaseModel.countDocuments()) + 1
      : this.purchases.length + 1;
    const purchaseNo = `PO-2026-${count.toString().padStart(4, '0')}`;

    const newPurchase = {
      purchaseNo,
      supplierId: purchaseData.supplierId,
      items: purchaseData.items,
      totalAmount: roundMoney(purchaseData.totalAmount),
      status: purchaseData.status || 'Ordered',
      createdBy: userId,
      notes: purchaseData.notes,
      createdAt: new Date(),
    };

    if (getIsDbConnected()) {
      const p = new PurchaseModel(newPurchase);
      return await p.save();
    }
    const p = { _id: this.genId(), ...newPurchase };
    this.purchases.unshift(p);
    return p;
  }

  async updatePurchase(purchaseId: string, updates: any) {
    if (getIsDbConnected()) {
      const p = await PurchaseModel.findById(purchaseId);
      if (!p) throw new Error('Purchase order not found');
      if (p.status === 'Received') throw new Error('Cannot edit an already received purchase order.');
      Object.assign(p, updates);
      return await p.save();
    }
    const index = this.purchases.findIndex((item) => item._id.toString() === purchaseId.toString());
    if (index === -1) throw new Error('Purchase order not found');
    if (this.purchases[index].status === 'Received') throw new Error('Cannot edit an already received purchase order.');
    this.purchases[index] = { ...this.purchases[index], ...updates, updatedAt: new Date() };
    return this.purchases[index];
  }

  async cancelPurchase(purchaseId: string) {
    if (getIsDbConnected()) {
      const p = await PurchaseModel.findById(purchaseId);
      if (!p) throw new Error('Purchase order not found');
      if (p.status === 'Received') throw new Error('Cannot cancel an already received purchase order.');
      p.status = 'Cancelled';
      return await p.save();
    }
    const p = this.purchases.find((item) => item._id.toString() === purchaseId.toString());
    if (!p) throw new Error('Purchase order not found');
    if (p.status === 'Received') throw new Error('Cannot cancel an already received purchase order.');
    p.status = 'Cancelled';
    return p;
  }

  async receivePurchaseStock(purchaseId: string, userId: string) {
    let p: any = null;
    if (getIsDbConnected()) {
      p = await PurchaseModel.findById(purchaseId);
    } else {
      p = this.purchases.find((item) => item._id.toString() === purchaseId.toString());
    }

    if (!p) throw new Error('Purchase order not found');
    if (p.status === 'Received') throw new Error('Purchase is already received');

    p.status = 'Received';
    p.receivedAt = new Date();

    // Create batches and stock movement for each item
    for (const item of p.items) {
      if (getIsDbConnected()) {
        const batch = new InventoryBatchModel({
          medicationId: item.medicationId,
          batchNo: item.batchNo,
          expiryDate: new Date(item.expiryDate),
          quantityInStock: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          supplierId: p.supplierId,
          receivedAt: new Date(),
          status: 'active',
        });
        await batch.save();

        await new StockMovementModel({
          medicationId: item.medicationId,
          batchId: batch._id,
          movementType: 'PURCHASE_RECEIPT',
          quantity: item.quantity,
          balanceBefore: 0,
          balanceAfter: item.quantity,
          referenceId: p.purchaseNo,
          performedBy: userId,
          reason: `Stock receipt against PO ${p.purchaseNo}`,
        }).save();
      } else {
        const batchId = this.genId();
        this.batches.unshift({
          _id: batchId,
          medicationId: item.medicationId,
          batchNo: item.batchNo,
          expiryDate: new Date(item.expiryDate),
          quantityInStock: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          supplierId: p.supplierId,
          receivedAt: new Date(),
          status: 'active',
          createdAt: new Date(),
        });

        this.stockMovements.unshift({
          _id: this.genId(),
          medicationId: item.medicationId,
          batchId: batchId,
          movementType: 'PURCHASE_RECEIPT',
          quantity: item.quantity,
          balanceBefore: 0,
          balanceAfter: item.quantity,
          referenceId: p.purchaseNo,
          performedBy: userId,
          reason: `Stock receipt against PO ${p.purchaseNo}`,
          createdAt: new Date(),
        });
      }
    }

    if (getIsDbConnected()) {
      await p.save();
    }
    return p;
  }

  // EXPIRY MANAGEMENT
  async getExpiryData(range: string) {
    let batches: any[] = [];
    let meds: any[] = [];
    let suppliers: any[] = [];

    if (getIsDbConnected()) {
      batches = await InventoryBatchModel.find().lean();
      meds = await MedicationModel.find().lean();
      suppliers = await SupplierModel.find().lean();
    } else {
      batches = this.batches;
      meds = this.medications;
      suppliers = this.suppliers;
    }

    const now = new Date();

    const mapped = batches.map((b) => {
      const med = meds.find((m) => m._id.toString() === b.medicationId.toString());
      const sup = suppliers.find((s) => s._id.toString() === b.supplierId?.toString());
      const expDate = new Date(b.expiryDate);
      const diffMs = expDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status = 'Good';
      if (daysRemaining < 0) {
        status = 'Expired';
      } else if (daysRemaining <= 7) {
        status = 'Expiring in 7 Days';
      } else if (daysRemaining <= 30) {
        status = 'Expiring in 30 Days';
      } else if (daysRemaining <= 90) {
        status = 'Expiring in 90 Days';
      }

      return {
        _id: b._id,
        medicationId: b.medicationId,
        medicationName: med?.name || 'Unknown Medicine',
        genericName: med?.genericName || '',
        category: med?.category || '',
        batchNo: b.batchNo,
        quantityInStock: b.quantityInStock,
        expiryDate: b.expiryDate,
        daysRemaining,
        supplierName: sup?.supplierName || 'Direct',
        status,
        batchStatus: b.status,
      };
    });

    if (range === '7') return mapped.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7);
    if (range === '30') return mapped.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30);
    if (range === '90') return mapped.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 90);
    if (range === 'expired') return mapped.filter((item) => item.daysRemaining < 0);
    return mapped;
  }

  async disposeBatch(batchId: string, reason: string, userId: string) {
    if (getIsDbConnected()) {
      const batch = await InventoryBatchModel.findById(batchId);
      if (!batch) throw new Error('Batch not found');
      const qty = batch.quantityInStock;
      const balanceBefore = qty;
      batch.quantityInStock = 0;
      batch.status = 'depleted';
      await batch.save();

      await new StockMovementModel({
        medicationId: batch.medicationId,
        batchId: batch._id,
        movementType: 'EXPIRED_REMOVAL',
        quantity: -qty,
        balanceBefore,
        balanceAfter: 0,
        performedBy: userId,
        reason: reason || 'Expired batch disposed',
      }).save();
      return batch;
    } else {
      const batch = this.batches.find((b) => b._id.toString() === batchId.toString());
      if (!batch) throw new Error('Batch not found');
      const qty = batch.quantityInStock;
      const balanceBefore = qty;
      batch.quantityInStock = 0;
      batch.status = 'depleted';

      this.stockMovements.unshift({
        _id: this.genId(),
        medicationId: batch.medicationId,
        batchId: batch._id,
        movementType: 'EXPIRED_REMOVAL',
        quantity: -qty,
        balanceBefore,
        balanceAfter: 0,
        performedBy: userId,
        reason: reason || 'Expired batch disposed',
        createdAt: new Date(),
      });
      return batch;
    }
  }

  // ALERTS
  async getAlerts() {
    if (getIsDbConnected()) {
      return await StockAlertModel.find().populate('medicationId', 'name category').sort({ createdAt: -1 }).lean();
    }
    return this.stockAlerts.map((a) => {
      const med = this.medications.find((m) => m._id.toString() === a.medicationId.toString());
      return {
        ...a,
        medicationId: med ? { _id: med._id, name: med.name, category: med.category } : null,
      };
    });
  }

  async createAlert(data: any) {
    if (getIsDbConnected()) {
      const alert = new StockAlertModel(data);
      return await alert.save();
    }
    const newAlert = { _id: this.genId(), ...data, status: 'unread', createdAt: new Date() };
    this.stockAlerts.unshift(newAlert);
    return newAlert;
  }

  async markAlertRead(id: string) {
    if (getIsDbConnected()) {
      return await StockAlertModel.findByIdAndUpdate(id, { status: 'read', readAt: new Date() }, { new: true });
    }
    const alert = this.stockAlerts.find((a) => a._id.toString() === id.toString());
    if (alert) {
      alert.status = 'read';
      alert.readAt = new Date();
    }
    return alert;
  }

  async markAllAlertsRead() {
    if (getIsDbConnected()) {
      return await StockAlertModel.updateMany({ status: 'unread' }, { status: 'read', readAt: new Date() });
    }
    this.stockAlerts.forEach((a) => {
      if (a.status === 'unread') {
        a.status = 'read';
        a.readAt = new Date();
      }
    });
    return true;
  }

  // DASHBOARD STATS
  async getDashboardStats() {
    const meds = await this.getMedications({});
    const sales = await this.getSales({});
    const alerts = await this.getAlerts();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todaySales = sales.filter((s) => new Date(s.createdAt) >= startOfToday && s.status === 'completed');
    const todaySalesAmount = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

    const totalStockUnits = meds.reduce((sum, m) => sum + m.availableQuantity, 0);
    const lowStockCount = meds.filter((m) => m.stockStatus === 'Low Stock' || m.stockStatus === 'Out of Stock').length;
    const expiringSoonCount = meds.filter((m) => m.stockStatus === 'Expiring Soon').length;

    // Weekly sales breakdown (Last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySalesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = days[d.getDay()];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const dayTotal = sales
        .filter((s) => {
          const sc = new Date(s.createdAt);
          return sc >= dayStart && sc < dayEnd && s.status === 'completed';
        })
        .reduce((sum, s) => sum + s.totalAmount, 0);

      weeklySalesData.push({
        day: dayName,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        amount: roundMoney(dayTotal),
      });
    }

    // Payment method distribution
    const paymentMethods = { Cash: 0, Card: 0, UPI: 0 };
    sales.filter((s) => s.status === 'completed').forEach((s) => {
      const mode = (s.paymentMode as 'Cash' | 'Card' | 'UPI') || 'Cash';
      paymentMethods[mode] = (paymentMethods[mode] || 0) + s.totalAmount;
    });
    const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
      name,
      value: roundMoney(value),
    }));

    // Top-selling medicines
    const medicineSalesMap: Record<string, { name: string; quantity: number; total: number }> = {};
    sales.filter((s) => s.status === 'completed').forEach((s) => {
      s.items.forEach((item: any) => {
        if (!medicineSalesMap[item.medicationName]) {
          medicineSalesMap[item.medicationName] = { name: item.medicationName, quantity: 0, total: 0 };
        }
        medicineSalesMap[item.medicationName].quantity += item.quantity;
        medicineSalesMap[item.medicationName].total += item.subtotal;
      });
    });
    const topMedicines = Object.values(medicineSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Inventory by category
    const categoryMap: Record<string, number> = {};
    meds.forEach((m) => {
      categoryMap[m.category] = (categoryMap[m.category] || 0) + m.availableQuantity;
    });
    const categoryData = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      todaySales: roundMoney(todaySalesAmount),
      totalMedicines: meds.length,
      totalStockUnits,
      lowStockCount,
      expiringSoonCount,
      todayTransactions: todaySales.length,
      weeklySales: weeklySalesData,
      paymentData,
      topMedicines,
      categoryData,
      activeAlerts: alerts.filter((a) => a.status === 'unread').slice(0, 6),
      recentSales: sales.slice(0, 5),
    };
  }

  // SETTINGS
  async getSettings() {
    if (getIsDbConnected()) {
      const s = await SettingsModel.findOne();
      if (s) return s;
    }
    return this.settings;
  }

  async updateSettings(updates: any) {
    if (getIsDbConnected()) {
      let s = await SettingsModel.findOne();
      if (!s) {
        s = new SettingsModel(updates);
      } else {
        Object.assign(s, updates);
      }
      return await s.save();
    }
    this.settings = { ...this.settings, ...updates, updatedAt: new Date() };
    return this.settings;
  }
}

export const dbStore = new InMemoryStore();
