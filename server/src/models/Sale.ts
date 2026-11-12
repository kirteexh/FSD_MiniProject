import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem {
  medicationId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  medicationName: string;
  batchNo: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale extends Document {
  invoiceNo: string;
  cashierId: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'Card' | 'UPI';
  status: 'completed' | 'returned' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'InventoryBatch', required: true },
    medicationName: { type: String, required: true },
    batchNo: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ['Cash', 'Card', 'UPI'], default: 'Cash' },
    status: { type: String, enum: ['completed', 'returned', 'cancelled'], default: 'completed', index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SaleModel = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

