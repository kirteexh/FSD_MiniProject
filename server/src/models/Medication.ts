import mongoose, { Document, Schema } from 'mongoose';

export interface IMedication extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>(
  {
    name: { type: String, required: true, trim: true, index: true },
    genericName: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    manufacturer: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, index: true },
    unit: { type: String, default: 'Tablets' }, // Tablets, Capsules, Syrup, Injection, Cream, Drops
    reorderThreshold: { type: Number, default: 20 },
    prescriptionRequired: { type: Boolean, default: false },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MedicationModel = mongoose.models.Medication || mongoose.model<IMedication>('Medication', MedicationSchema);

