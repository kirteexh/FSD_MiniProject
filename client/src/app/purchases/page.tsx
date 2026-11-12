'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  PackageCheck,
  CheckCircle,
  Truck,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Purchase, Supplier, Medication } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

export default function PurchasesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Purchase Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [purchaseBatchNo, setPurchaseBatchNo] = useState('');
  const [purchaseExpiry, setPurchaseExpiry] = useState('');
  const [purchaseQty, setPurchaseQty] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState(10);
  const [sellingPrice, setSellingPrice] = useState(15);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [receivingId, setReceivingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, mRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getMedications(),
      ]);
      if (pRes.purchases) setPurchases(pRes.purchases);
      if (sRes.suppliers) {
        setSuppliers(sRes.suppliers);
        if (sRes.suppliers.length > 0) setSelectedSupplierId(sRes.suppliers[0]._id);
      }
      if (mRes.medications) {
        setMedications(mRes.medications);
        if (mRes.medications.length > 0) setSelectedMedId(mRes.medications[0]._id);
      }
    } catch (err: any) {
      toast.error('Failed to load purchases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const med = medications.find((m) => m._id === selectedMedId);
    if (!med || !selectedSupplierId) {
      toast.error('Please select both supplier and medicine.');
      return;
    }

    try {
      const item = {
        medicationId: med._id,
        medicationName: med.name,
        batchNo: purchaseBatchNo || `BATCH-${Date.now().toString().slice(-4)}`,
        expiryDate: purchaseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: Number(purchaseQty),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        subtotal: Number(purchaseQty) * Number(purchasePrice),
      };

      await api.createPurchase({
        supplierId: selectedSupplierId,
        items: [item],
        notes: purchaseNotes,
      });

      toast.success('Purchase order created successfully!');
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create purchase order.');
    }
  };

  const handleReceiveStock = async (purchaseId: string) => {
    setReceivingId(purchaseId);
    try {
      await api.receiveStock(purchaseId);
      toast.success('Stock received! Batches updated and inventory quantities increased.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to receive stock.');
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Purchases & Stock Receiving
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue distributor purchase orders and intake consignments directly into inventory batches.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Create Purchase Order
            </button>
          )}
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b">
                <tr>
                  <th className="px-5 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Date Created</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Medicines Ordered</th>
                  <th className="px-4 py-3.5">Total Cost</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{p.purchaseNo}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {p.supplierId?.supplierName || 'Distributor'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {p.items?.map((i) => `${i.medicationName} (${i.quantity})`).join(', ') || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Received'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'Ordered'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isAdmin && p.status !== 'Received' && p.status !== 'Cancelled' ? (
                          <button
                            onClick={() => handleReceiveStock(p._id)}
                            disabled={receivingId === p._id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            {receivingId === p._id ? 'Receiving...' : 'Receive Stock'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {p.status === 'Received' ? 'Stock Added' : 'No Actions'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Purchase Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Submit a restocking order to an authorized supplier."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medication to Restock *</label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              >
                {medications.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} (Current Stock: {m.availableQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g. PO-BATCH-99"
                value={purchaseBatchNo}
                onChange={(e) => setPurchaseBatchNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={purchaseExpiry}
                onChange={(e) => setPurchaseExpiry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Purchase Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Order Cost</label>
              <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                {formatCurrency(purchaseQty * purchasePrice)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
            >
              Submit Order
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

