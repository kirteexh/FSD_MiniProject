import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getSeedData } from './seedData.js';
import { UserModel } from '../models/User.js';
import { SupplierModel } from '../models/Supplier.js';
import { MedicationModel } from '../models/Medication.js';
import { InventoryBatchModel } from '../models/InventoryBatch.js';
import { SaleModel } from '../models/Sale.js';
import { PurchaseModel } from '../models/Purchase.js';
import { StockAlertModel } from '../models/StockAlert.js';
import { StockMovementModel } from '../models/StockMovement.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { SettingsModel } from '../models/Settings.js';

dotenv.config();

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacare_db';
  try {
    console.log(`[Seed] Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);
    console.log('[Seed] Connected. Clearing existing collections...');

    await Promise.all([
      UserModel.deleteMany({}),
      SupplierModel.deleteMany({}),
      MedicationModel.deleteMany({}),
      InventoryBatchModel.deleteMany({}),
      SaleModel.deleteMany({}),
      PurchaseModel.deleteMany({}),
      StockAlertModel.deleteMany({}),
      StockMovementModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      SettingsModel.deleteMany({}),
    ]);

    console.log('[Seed] Inserting fresh seed data...');
    const data = getSeedData();

    await UserModel.insertMany(data.users);
    await SupplierModel.insertMany(data.suppliers);
    await MedicationModel.insertMany(data.medications);
    await InventoryBatchModel.insertMany(data.batches);
    await SaleModel.insertMany(data.sales);
    await PurchaseModel.insertMany(data.purchases);
    await StockAlertModel.insertMany(data.stockAlerts);
    await StockMovementModel.insertMany(data.stockMovements);
    await AuditLogModel.insertMany(data.auditLogs);
    await new SettingsModel(data.settings).save();

    console.log('[Seed] ✅ Database successfully seeded with PharmaCare initial data!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

