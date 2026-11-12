'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { ExpiryBatch } from '@/types';
import { formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

function ExpiryContent() {
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState(searchParams.get('range') || '30');
  const [batches, setBatches] = useState<ExpiryBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispose Modal
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ExpiryBatch | null>(null);
  const [disposeReason, setDisposeReason] = useState('Expired batch incinerated and discarded per protocol');
  const [processingDispose, setProcessingDispose] = useState(false);

  useEffect(() => {
    fetchExpiryData();
  }, [activeTab]);

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      const res = await api.getExpiry(activeTab);
      if (res.batches) setBatches(res.batches);
    } catch (err: any) {
      toast.error('Failed to load expiry data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setProcessingDispose(true);
    try {
      await api.disposeBatch(selectedBatch._id, disposeReason);
      toast.success(`Batch ${selectedBatch.batchNo} disposed and stock balance cleared.`);
      setDisposeModalOpen(false);
      setSelectedBatch(null);
      fetchExpiryData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispose batch.');
    } finally {
      setProcessingDispose(false);
    }
  };

  const tabs = [
    { id: '7', label: 'Within 7 Days', color: 'rose' },
    { id: '30', label: 'Within 30 Days', color: 'amber' },
    { id: '90', label: 'Within 90 Days', color: 'sky' },
    { id: 'expired', label: 'Already Expired', color: 'red' },
    { id: 'all', label: 'All Batches', color: 'slate' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Medicine Expiry & Shelf-Life Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Proactive tracking of expiring batches, days remaining alerts, and safe clinical disposals.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Expiry Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b">
                <tr>
                  <th className="px-5 py-3.5">Medicine</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Batch No</th>
                  <th className="px-4 py-3.5">Stock Left</th>
                  <th className="px-4 py-3.5">Expiry Date</th>
                  <th className="px-4 py-3.5">Days Remaining</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Shelf Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Scanning expiry records...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      No batches matching the selected expiry window.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{b.medicationName}</div>
                        <div className="text-[11px] text-slate-400">{b.genericName}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{b.category}</td>
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-800">{b.batchNo}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{b.quantityInStock}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">{formatDate(b.expiryDate)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-extrabold ${
                            b.daysRemaining < 0
                              ? 'text-red-700'
                              : b.daysRemaining <= 7
                              ? 'text-rose-600'
                              : b.daysRemaining <= 30
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.daysRemaining < 0
                            ? `Expired (${Math.abs(b.daysRemaining)}d ago)`
                            : `${b.daysRemaining} days`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{b.supplierName}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.daysRemaining < 0
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : b.daysRemaining <= 7
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : b.daysRemaining <= 30
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isAdmin && b.quantityInStock > 0 && (
                          <button
                            onClick={() => {
                              setSelectedBatch(b);
                              setDisposeModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                            title="Dispose and Clear Stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Dispose
                          </button>
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

      {/* Dispose Batch Modal */}
      {selectedBatch && (
        <Modal
          isOpen={disposeModalOpen}
          onClose={() => setDisposeModalOpen(false)}
          title={`Write Off & Dispose: ${selectedBatch.medicationName}`}
          subtitle={`Batch ${selectedBatch.batchNo} (${selectedBatch.quantityInStock} units)`}
          maxWidth="md"
        >
          <form onSubmit={handleDisposeSubmit} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <ShieldAlert className="w-4 h-4 inline mr-1.5 text-rose-600" />
              This will reduce active stock to 0 and log an <strong>EXPIRED_REMOVAL</strong> stock movement.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disposal Reason *</label>
              <textarea
                required
                rows={3}
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDisposeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingDispose}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                {processingDispose ? 'Writing off...' : 'Confirm Disposal'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}

export default function ExpiryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
          Loading expiry data...
        </div>
      }
    >
      <ExpiryContent />
    </React.Suspense>
  );
}


