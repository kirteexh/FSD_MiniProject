import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryBatch extends Document {
  medicationId: mongoose.Types.ObjectId;
  batchNo: string;
  expiryDate: Date;
  quantityInStock: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: mongoose.Types.ObjectId;
  receivedAt: Date;
  status: 'active' | 'depleted' | 'expired' | 'quarantined';
  createdAt: Date;
  updatedAt: Date;
}

const InventoryBatchSchema = new Schema<IInventoryBatch>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
    batchNo: { type: String, required: true, trim: true, index: true },
    expiryDate: { type: Date, required: true, index: true },
    quantityInStock: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    receivedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'depleted', 'expired', 'quarantined'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

export const InventoryBatchModel =
  mongoose.models.InventoryBatch || mongoose.model<IInventoryBatch>('InventoryBatch', InventoryBatchSchema);

