'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Sale } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

function SalesHistoryContent() {
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const settings = useAppSelector((state) => state.settings.settings);
  const isAdmin = user?.role === 'admin';

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Customer return with valid receipt');
  const [processingReturn, setProcessingReturn] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [statusFilter, paymentFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.getSales({
        search,
        status: statusFilter,
        paymentMode: paymentFilter,
      });
      if (res.sales) setSales(res.sales);
    } catch (err: any) {
      toast.error('Failed to load sales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    setProcessingReturn(true);
    try {
      await api.returnSale(selectedSale._id, returnReason);
      toast.success(`Invoice ${selectedSale.invoiceNo} marked as returned and stock restored.`);
      setReturnModalOpen(false);
      setSelectedSale(null);
      fetchSales();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process return.');
    } finally {
      setProcessingReturn(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.invoiceNo.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.cashierId?.name && s.cashierId.name.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Billing Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review transaction audit trails, reprint receipts, and process authorized patient returns.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number, customer name, or cashier..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="completed">Completed</option>
              <option value="returned">Returned</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">Payment: All</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b">
                <tr>
                  <th className="px-5 py-3.5">Invoice No</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Cashier</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Loading sales history...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{sale.invoiceNo}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDateTime(sale.createdAt)}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{sale.customerName || 'Walk-in'}</td>
                      <td className="px-4 py-3.5 text-slate-600">{sale.cashierId?.name || 'Staff'}</td>
                      <td className="px-4 py-3.5 text-slate-600">{sale.items?.length || 0} items</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{sale.paymentMode}</td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && sale.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setReturnModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Process Return / Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
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

      {/* View Invoice Modal */}
      {selectedSale && !returnModalOpen && (
        <Modal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          title={`Invoice ${selectedSale.invoiceNo}`}
          subtitle={`Processed on ${formatDateTime(selectedSale.createdAt)}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-6 bg-slate-50 border rounded-2xl printable-invoice space-y-4 text-xs">
              <div className="text-center pb-3 border-b">
                <h3 className="text-base font-bold text-slate-900">{settings.pharmacyName}</h3>
                <p className="text-[11px] text-slate-500">{settings.address}</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <div><strong>Invoice:</strong> {selectedSale.invoiceNo}</div>
                  <div><strong>Status:</strong> <span className="uppercase font-bold">{selectedSale.status}</span></div>
                </div>
                <div className="text-right">
                  <div><strong>Customer:</strong> {selectedSale.customerName}</div>
                  <div><strong>Payment Mode:</strong> {selectedSale.paymentMode}</div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-t border-b">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-2">Item</th>
                    <th className="py-2">Batch</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{i.medicationName}</td>
                      <td className="py-2 font-mono text-[10px]">{i.batchNo}</td>
                      <td className="py-2 text-center">{i.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(i.unitPrice)}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-right text-xs">
                <div>Subtotal: <strong>{formatCurrency(selectedSale.subtotal)}</strong></div>
                {selectedSale.discount > 0 && <div>Discount: -{formatCurrency(selectedSale.discount)}</div>}
                <div>Tax: <strong>{formatCurrency(selectedSale.tax)}</strong></div>
                <div className="text-sm font-extrabold text-slate-900 pt-1 border-t">
                  Total Amount: {formatCurrency(selectedSale.totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return & Refund Modal */}
      {selectedSale && returnModalOpen && (
        <Modal
          isOpen={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          title={`Return / Refund Invoice ${selectedSale.invoiceNo}`}
          subtitle="This will restore items to inventory and record a refund transaction."
          maxWidth="md"
        >
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              Total refund amount: <strong>{formatCurrency(selectedSale.totalAmount)}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Return *</label>
              <textarea
                required
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Doctor changed prescription, Damaged outer packaging"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingReturn}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {processingReturn ? 'Processing...' : 'Confirm Return & Restore Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}

export default function SalesHistoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
          Loading sales history...
        </div>
      }
    >
      <SalesHistoryContent />
    </React.Suspense>
  );
}


