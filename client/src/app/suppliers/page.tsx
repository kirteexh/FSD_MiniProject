'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Mail, Phone, MapPin, Building, Eye, Edit2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Supplier } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

export default function SuppliersPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [formData, setFormData] = useState({
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    paymentTerms: 'Net 30',
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      if (res.suppliers) setSuppliers(res.suppliers);
    } catch (err: any) {
      toast.error('Failed to load suppliers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      toast.success(`Supplier ${formData.supplierName} created!`);
      setAddModalOpen(false);
      setFormData({
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
        paymentTerms: 'Net 30',
        notes: '',
      });
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create supplier.');
    }
  };

  const openDetailModal = async (s: Supplier) => {
    try {
      const res = await api.getSupplierById(s._id);
      setSelectedSupplier(res.supplier);
      setDetailModalOpen(true);
    } catch {
      setSelectedSupplier(s);
      setDetailModalOpen(true);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers & Distributors</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage pharmaceutical vendors, trade credit terms, and purchase orders.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Supplier
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor name, representative, or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Suppliers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-8 text-center text-xs text-slate-400">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full p-8 text-center text-xs text-slate-400">No suppliers found.</div>
          ) : (
            filteredSuppliers.map((s) => (
              <div
                key={s._id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{s.supplierName}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Contact: {s.contactPerson}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Terms: {s.paymentTerms || 'Net 30'}</span>
                  <button
                    onClick={() => openDetailModal(s)}
                    className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Info
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Pharmaceutical Supplier"
        subtitle="Register a new authorized medicine distributor."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                required
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="e.g. Cipla Healthcare Direct"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Representative *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Meera Patel"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@supplier.com"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Building, street, district, city"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Registration</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g. 27AAACC5678G2Z2"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="e.g. Net 30, Immediate"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={selectedSupplier.supplierName}
          subtitle={`Representative: ${selectedSupplier.contactPerson}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
              <div><strong>Email:</strong> {selectedSupplier.email}</div>
              <div><strong>Phone:</strong> {selectedSupplier.phone}</div>
              <div><strong>Address:</strong> {selectedSupplier.address}</div>
              <div><strong>GST:</strong> {selectedSupplier.gstNumber || 'Not specified'}</div>
              <div><strong>Credit Terms:</strong> {selectedSupplier.paymentTerms}</div>
            </div>

            {selectedSupplier.purchases && selectedSupplier.purchases.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Purchase Orders History</h4>
                <div className="space-y-1.5">
                  {selectedSupplier.purchases.map((p: any) => (
                    <div key={p._id} className="p-2.5 bg-white border rounded-lg flex justify-between">
                      <span className="font-bold">{p.purchaseNo}</span>
                      <span>Total: ₹{p.totalAmount}</span>
                      <span className="font-semibold text-sky-600">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

