import mongoose, { Document, Schema } from 'mongoose';

export interface IStockAlert extends Document {
  medicationId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string;
  thresholdAtAlert?: number;
  status: 'unread' | 'read' | 'resolved';
  readAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'InventoryBatch' },
    alertType: {
      type: String,
      enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED'],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    thresholdAtAlert: { type: Number },
    status: { type: String, enum: ['unread', 'read', 'resolved'], default: 'unread', index: true },
    readAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const StockAlertModel = mongoose.models.StockAlert || mongoose.model<IStockAlert>('StockAlert', StockAlertSchema);

