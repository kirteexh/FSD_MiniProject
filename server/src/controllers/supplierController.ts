import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await dbStore.getSuppliers();
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await dbStore.getSupplierById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }
    res.json({ success: true, supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { supplierName, contactPerson, phone, email, address, gstNumber, paymentTerms, notes } = req.body;
    if (!supplierName || !contactPerson || !phone || !email || !address) {
      return res.status(400).json({ success: false, message: 'Missing required supplier fields.' });
    }

    const supplier = await dbStore.createSupplier({
      supplierName,
      contactPerson,
      phone,
      email,
      address,
      gstNumber,
      paymentTerms,
      notes,
    });

    res.status(201).json({ success: true, supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await dbStore.updateSupplier(id, req.body);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }
    res.json({ success: true, supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

