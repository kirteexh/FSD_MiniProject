import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getMedications = async (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;
    const medications = await dbStore.getMedications({
      search: search as string,
      category: category as string,
      status: status as string,
    });
    res.json({ success: true, count: medications.length, medications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const medication = await dbStore.getMedicationById(id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.json({ success: true, medication });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicationByBarcode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const medication = await dbStore.getMedicationByBarcode(code);
    if (!medication) {
      return res.status(404).json({ success: false, message: `Medication with barcode ${code} not found.` });
    }
    res.json({ success: true, medication });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMedication = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      genericName,
      category,
      manufacturer,
      barcode,
      unit,
      reorderThreshold,
      prescriptionRequired,
      description,
      initialBatch,
    } = req.body;

    if (!name || !genericName || !category || !manufacturer) {
      return res.status(400).json({ success: false, message: 'Missing required medication fields.' });
    }

    const result = await dbStore.createMedication(
      {
        name,
        genericName,
        category,
        manufacturer,
        barcode: barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        unit: unit || 'Tablets',
        reorderThreshold: Number(reorderThreshold) || 20,
        prescriptionRequired: Boolean(prescriptionRequired),
        description,
      },
      initialBatch,
      req.user?._id
    );

    res.status(201).json({ success: true, medication: result.medication, batch: result.batch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMedication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await dbStore.updateMedication(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.json({ success: true, medication: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const archiveMedication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbStore.archiveMedication(id);
    res.json({ success: true, message: 'Medication archived successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { batchNo, expiryDate, quantityInStock, purchasePrice, sellingPrice, supplierId } = req.body;

    if (!batchNo || !expiryDate || !quantityInStock || !sellingPrice) {
      return res.status(400).json({ success: false, message: 'Missing required batch fields.' });
    }

    const batch = await dbStore.addBatch(
      {
        medicationId: id,
        batchNo,
        expiryDate: new Date(expiryDate),
        quantityInStock: Number(quantityInStock),
        purchasePrice: Number(purchasePrice || 0),
        sellingPrice: Number(sellingPrice),
        supplierId,
      },
      req.user?._id
    );

    res.status(201).json({ success: true, batch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { batchId, quantityChange, reason } = req.body;

    if (!batchId || quantityChange === undefined || !reason) {
      return res.status(400).json({ success: false, message: 'Batch ID, quantity change, and reason are required.' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User session required for stock adjustment.' });
    }

    const batch = await dbStore.adjustStock(
      id,
      batchId,
      Number(quantityChange),
      reason,
      req.user._id
    );

    res.json({ success: true, batch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
