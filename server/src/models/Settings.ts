import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
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
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    pharmacyName: { type: String, default: 'PharmaCare Chemist & Druggist' },
    phone: { type: String, default: '+91 98201 23456' },
    email: { type: String, default: 'care@pharmacare.in' },
    address: { type: String, default: 'Shop No. 4, Shree Ganesh Complex, MG Road, Dadar West, Mumbai, MH - 400028' },
    gstNumber: { type: String, default: '27AABCP1234F1Z8' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    taxRate: { type: Number, default: 5 }, // 5% GST
    invoicePrefix: { type: String, default: 'INV-2026-' },
    receiptFooter: { type: String, default: 'Thank you for choosing PharmaCare Chemist. Get well soon! (Medicines returnable within 7 days with original cash memo).' },
    defaultReorderThreshold: { type: Number, default: 20 },
    expiryAlertDays: { type: Number, default: 60 },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

