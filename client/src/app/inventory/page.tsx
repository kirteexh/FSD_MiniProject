'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Medication, InventoryBatch } from '@/types';
import { formatCurrency, formatDate, getStockStatusColor } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

function InventoryContent() {
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  // Form states for Add Medicine
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    manufacturer: '',
    barcode: '',
    unit: 'Tablets',
    reorderThreshold: 20,
    prescriptionRequired: false,
    description: '',
    batchNo: '',
    expiryDate: '',
    quantityInStock: 50,
    purchasePrice: 10,
    sellingPrice: 15,
  });

  // Adjust stock form state
  const [adjustData, setAdjustData] = useState({
    batchId: '',
    quantityChange: 10,
    reason: 'Manual inventory count adjustment',
  });

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, statusFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getMedications({
        category: categoryFilter,
        status: statusFilter,
      });
      if (res.medications) {
        setMedications(res.medications);
      }
    } catch (err: any) {
      toast.error('Failed to load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered & Sorted items
  const filteredMedications = useMemo(() => {
    let result = [...medications];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.manufacturer.toLowerCase().includes(q) ||
          (m.barcode && m.barcode.toLowerCase().includes(q)) ||
          (m.batchNumber && m.batchNumber.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'stock') {
        return sortOrder === 'asc'
          ? a.availableQuantity - b.availableQuantity
          : b.availableQuantity - a.availableQuantity;
      }
      if (sortBy === 'price') {
        return sortOrder === 'asc'
          ? a.pricePerUnit - b.pricePerUnit
          : b.pricePerUnit - a.pricePerUnit;
      }
      return 0;
    });

    return result;
  }, [medications, searchTerm, sortBy, sortOrder]);

  // Paginated slices
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage) || 1;
  const paginatedMeds = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedications.slice(start, start + itemsPerPage);
  }, [filteredMedications, currentPage]);

  const categories = [
    'All',
    'Antibiotics',
    'Painkillers',
    'Diabetes',
    'Cardiovascular',
    'Gastrointestinal',
    'Respiratory',
    'Vitamins & Supplements',
    'Dermatology',
  ];

  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedication({
        name: formData.name,
        genericName: formData.genericName,
        category: formData.category,
        manufacturer: formData.manufacturer,
        barcode: formData.barcode,
        unit: formData.unit,
        reorderThreshold: Number(formData.reorderThreshold),
        prescriptionRequired: formData.prescriptionRequired,
        description: formData.description,
        initialBatch: formData.batchNo
          ? {
              batchNo: formData.batchNo,
              expiryDate: formData.expiryDate,
              quantityInStock: Number(formData.quantityInStock),
              purchasePrice: Number(formData.purchasePrice),
              sellingPrice: Number(formData.sellingPrice),
            }
          : undefined,
      });

      toast.success(`${formData.name} added to inventory!`);
      setAddModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add medication.');
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !adjustData.batchId) {
      toast.error('Please select a batch to adjust.');
      return;
    }
    try {
      await api.adjustStock(selectedMed._id, {
        batchId: adjustData.batchId,
        quantityChange: Number(adjustData.quantityChange),
        reason: adjustData.reason,
      });
      toast.success('Stock adjusted successfully!');
      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock.');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive ${name}? This will remove it from active POS sales.`)) {
      try {
        await api.archiveMedication(id);
        toast.info(`${name} has been archived.`);
        fetchInventory();
      } catch (err: any) {
        toast.error('Failed to archive: ' + err.message);
      }
    }
  };

  const openDetailModal = async (med: Medication) => {
    try {
      const res = await api.getMedicationById(med._id);
      setSelectedMed(res.medication);
      setDetailModalOpen(true);
    } catch {
      setSelectedMed(med);
      setDetailModalOpen(true);
    }
  };

  const openAdjustModal = async (med: Medication) => {
    try {
      const res = await api.getMedicationById(med._id);
      setSelectedMed(res.medication);
      setAdjustData({
        batchId: res.medication.batches?.[0]?._id || '',
        quantityChange: 10,
        reason: 'Physical inventory audit adjustment',
      });
      setAdjustModalOpen(true);
    } catch {
      setSelectedMed(med);
      setAdjustModalOpen(true);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Medicine Inventory & Batches
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive stock monitoring, batch-level tracking, pricing, and reorder levels.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Medicine
              </button>
            )}
          </div>
        </div>

        {/* Search, Category Filter, Status Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by medicine name, generic name, manufacturer, batch or barcode..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medicines Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Medicine Name</th>
                  <th className="px-4 py-3.5">Generic & Category</th>
                  <th className="px-4 py-3.5">Active Batch</th>
                  <th className="px-4 py-3.5">
                    <button
                      onClick={() => {
                        setSortBy('stock');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Stock Available <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Price / Unit</th>
                  <th className="px-4 py-3.5">Expiry Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : paginatedMeds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No medicines matched the specified filters.
                    </td>
                  </tr>
                ) : (
                  paginatedMeds.map((med) => (
                    <tr key={med._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                        <div className="text-[11px] text-slate-400">{med.manufacturer}</div>
                      </td>

                      {/* Generic & Category */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-700 font-medium">{med.genericName}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                          {med.category}
                        </span>
                      </td>

                      {/* Active Batch */}
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {med.batchNumber || 'N/A'}
                      </td>

                      {/* Stock Units */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-bold text-sm ${
                            med.availableQuantity <= (med.reorderThreshold || 20)
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {med.availableQuantity}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">{med.unit}</span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {formatCurrency(med.pricePerUnit)}
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {med.expiryDate ? formatDate(med.expiryDate) : 'N/A'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStockStatusColor(
                            med.stockStatus
                          )}`}
                        >
                          {med.stockStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => openDetailModal(med)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="View Details & Batch History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAdjustModal(med)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Adjust Stock"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleArchive(med._id, med.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Archive Medicine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredMedications.length)} of{' '}
              {filteredMedications.length} medicines
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Medication"
        subtitle="Record a new medicine in the catalog with initial batch details."
        maxWidth="2xl"
      >
        <form onSubmit={handleAddMedicineSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generic / Formula Name *</label>
              <input
                type="text"
                required
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                placeholder="e.g. Amoxicillin Trihydrate"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g. Cipla Ltd."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. Tablets, Capsules, Syrup"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Threshold</label>
              <input
                type="number"
                value={formData.reorderThreshold}
                onChange={(e) => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Initial Batch Section */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Initial Batch Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={formData.batchNo}
                  onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                  placeholder="e.g. AMX-2026-X1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Initial Quantity</label>
                <input
                  type="number"
                  value={formData.quantityInStock}
                  onChange={(e) => setFormData({ ...formData, quantityInStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center pt-5">
                <input
                  type="checkbox"
                  id="rxReq"
                  checked={formData.prescriptionRequired}
                  onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="rxReq" className="ml-2 text-xs font-medium text-slate-700">
                  Prescription Required (Rx)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition-all"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedMed?.name || ''}`}
        subtitle="Add or subtract physical inventory units with a designated reason."
        maxWidth="md"
      >
        <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Batch</label>
            <select
              value={adjustData.batchId}
              onChange={(e) => setAdjustData({ ...adjustData, batchId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              {selectedMed?.batches?.map((b) => (
                <option key={b._id} value={b._id}>
                  Batch {b.batchNo} (Qty: {b.quantityInStock}, Exp: {formatDate(b.expiryDate)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Adjustment (+ to add, - to subtract)
            </label>
            <input
              type="number"
              required
              value={adjustData.quantityChange}
              onChange={(e) => setAdjustData({ ...adjustData, quantityChange: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Reason *</label>
            <input
              type="text"
              required
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Audit correction, Breakage, Shelf transfer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Details & Batches Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedMed?.name || 'Medicine Details'}
        subtitle={`${selectedMed?.genericName} • ${selectedMed?.category}`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock</span>
              <span className="font-extrabold text-sm text-slate-900">
                {selectedMed?.availableQuantity} {selectedMed?.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit Price</span>
              <span className="font-extrabold text-sm text-sky-700">
                {formatCurrency(selectedMed?.pricePerUnit || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Rx Status</span>
              <span className="font-extrabold text-sm text-slate-800">
                {selectedMed?.prescriptionRequired ? 'Prescription Required' : 'Over the Counter (OTC)'}
              </span>
            </div>
          </div>

          {/* Batches Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Available Inventory Batches
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Batch No</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Sell</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedMed?.batches?.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-medium">{b.batchNo}</td>
                      <td className="px-3 py-2 font-bold">{b.quantityInStock}</td>
                      <td className="px-3 py-2">{formatCurrency(b.purchasePrice)}</td>
                      <td className="px-3 py-2 font-semibold text-sky-700">{formatCurrency(b.sellingPrice)}</td>
                      <td className="px-3 py-2">{formatDate(b.expiryDate)}</td>
                      <td className="px-3 py-2 capitalize font-semibold text-slate-700">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Movements Log */}
          {selectedMed?.movements && selectedMed.movements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Recent Stock Movements
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedMed.movements.map((sm) => (
                  <div key={sm._id} className="p-2 bg-slate-50 border rounded-lg flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{sm.movementType}</span>: {sm.reason}
                    </div>
                    <span
                      className={`font-bold ${
                        sm.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {sm.quantity > 0 ? `+${sm.quantity}` : sm.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}

export default function InventoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
          Loading inventory...
        </div>
      }
    >
      <InventoryContent />
    </React.Suspense>
  );
}


