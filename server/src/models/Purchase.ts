import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseItem {
  medicationId: mongoose.Types.ObjectId;
  medicationName: string;
  batchNo: string;
  expiryDate: Date;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  subtotal: number;
}

export interface IPurchase extends Document {
  purchaseNo: string;
  supplierId: mongoose.Types.ObjectId;
  items: IPurchaseItem[];
  totalAmount: number;
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  createdBy: mongoose.Types.ObjectId;
  receivedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true },
    medicationName: { type: String, required: true },
    batchNo: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNo: { type: String, required: true, unique: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    items: [PurchaseItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Ordered', 'Partially Received', 'Received', 'Cancelled'],
      default: 'Ordered',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receivedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const PurchaseModel = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);

