import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleReturnItem {
  medicationId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  medicationName: string;
  batchNo: string;
  quantity: number;
  unitPrice: number;
  refundSubtotal: number;
}

export interface ISaleReturn extends Document {
  returnNo: string;
  originalSaleId: mongoose.Types.ObjectId;
  invoiceNo: string;
  items: ISaleReturnItem[];
  refundAmount: number;
  reason: string;
  processedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SaleReturnItemSchema = new Schema<ISaleReturnItem>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'InventoryBatch', required: true },
    medicationName: { type: String, required: true },
    batchNo: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    refundSubtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleReturnSchema = new Schema<ISaleReturn>(
  {
    returnNo: { type: String, required: true, unique: true, index: true },
    originalSaleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    invoiceNo: { type: String, required: true },
    items: [SaleReturnItemSchema],
    refundAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SaleReturnModel =
  mongoose.models.SaleReturn || mongoose.model<ISaleReturn>('SaleReturn', SaleReturnSchema);

