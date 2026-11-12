import mongoose, { Document, Schema } from 'mongoose';

export interface IStockMovement extends Document {
  medicationId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  movementType:
    | 'PURCHASE_RECEIPT'
    | 'SALE'
    | 'SALE_RETURN'
    | 'MANUAL_ADJUSTMENT'
    | 'DAMAGE_DISPOSAL'
    | 'EXPIRED_REMOVAL';
  quantity: number;
  balanceBefore?: number;
  balanceAfter?: number;
  referenceId?: string;
  performedBy: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'InventoryBatch', index: true },
    movementType: {
      type: String,
      enum: [
        'PURCHASE_RECEIPT',
        'SALE',
        'SALE_RETURN',
        'MANUAL_ADJUSTMENT',
        'DAMAGE_DISPOSAL',
        'EXPIRED_REMOVAL',
      ],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    balanceBefore: { type: Number },
    balanceAfter: { type: Number },
    referenceId: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const StockMovementModel =
  mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
