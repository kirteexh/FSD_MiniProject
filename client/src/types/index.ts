export type Role = 'admin' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface InventoryBatch {
  _id: string;
  medicationId: string;
  batchNo: string;
  expiryDate: string;
  quantityInStock: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: any;
  receivedAt: string;
  status: 'active' | 'depleted' | 'expired' | 'quarantined';
}

export interface Medication {
  _id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  barcode: string;
  unit: string;
  reorderThreshold: number;
  prescriptionRequired: boolean;
  description?: string;
  isActive: boolean;
  availableQuantity: number;
  pricePerUnit: number;
  purchasePrice?: number;
  batchNumber?: string;
  expiryDate?: string | null;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon' | 'Expired';
  batches?: InventoryBatch[];
  movements?: StockMovement[];
}

export interface StockMovement {
  _id: string;
  medicationId: string;
  batchId?: string;
  movementType: string;
  quantity: number;
  balanceAfter?: number;
  referenceId?: string;
  performedBy?: any;
  reason?: string;
  createdAt: string;
}

export interface CartItem {
  medicationId: string;
  name: string;
  genericName: string;
  category: string;
  batchNo: string;
  pricePerUnit: number;
  quantity: number;
  availableStock: number;
  prescriptionRequired: boolean;
}

export interface SaleItem {
  medicationId: string;
  batchId: string;
  medicationName: string;
  batchNo: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  invoiceNo: string;
  cashierId: {
    _id?: string;
    name: string;
    email: string;
    role: string;
  };
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'Card' | 'UPI';
  status: 'completed' | 'returned' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  _id: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  paymentTerms?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
  purchases?: any[];
}

export interface PurchaseItem {
  medicationId: string;
  medicationName: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  subtotal: number;
}

export interface Purchase {
  _id: string;
  purchaseNo: string;
  supplierId: any;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  createdBy?: any;
  receivedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpiryBatch {
  _id: string;
  medicationId: string;
  medicationName: string;
  genericName: string;
  category: string;
  batchNo: string;
  quantityInStock: number;
  expiryDate: string;
  daysRemaining: number;
  supplierName: string;
  status: string;
  batchStatus: string;
}

export interface StockAlert {
  _id: string;
  medicationId: {
    _id: string;
    name: string;
    category?: string;
  };
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string;
  thresholdAtAlert?: number;
  status: 'unread' | 'read' | 'resolved';
  createdAt: string;
}

export interface DashboardStats {
  todaySales: number;
  totalMedicines: number;
  totalStockUnits: number;
  lowStockCount: number;
  expiringSoonCount: number;
  todayTransactions: number;
  weeklySales: { day: string; date: string; amount: number }[];
  paymentData: { name: string; value: number }[];
  topMedicines: { name: string; quantity: number; total: number }[];
  categoryData: { category: string; count: number }[];
  activeAlerts: StockAlert[];
  recentSales: Sale[];
}

export interface Settings {
  pharmacyName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  invoicePrefix: string;
  receiptFooter: string;
  defaultReorderThreshold: number;
  expiryAlertDays: number;
}

