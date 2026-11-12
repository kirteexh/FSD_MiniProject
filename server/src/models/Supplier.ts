import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  paymentTerms?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierName: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true },
    paymentTerms: { type: String, default: 'Net 30' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SupplierModel = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

