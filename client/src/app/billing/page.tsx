'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  RotateCcw,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  FileDown,
  User,
  Phone,
  AlertTriangle,
  Receipt,
  ScanBarcode,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Medication, CartItem, Sale } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  setDiscount,
  setCustomerInfo,
  setPaymentMode,
  clearCart,
  holdBill,
  restoreHeldBill,
  deleteHeldBill,
} from '@/store/cartSlice';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart);
  const settings = useAppSelector((state) => state.settings.settings);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Checkout modal & invoice print state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [heldBillsModalOpen, setHeldBillsModalOpen] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.getMedications();
      if (res.medications) {
        setMedications(res.medications);
      }
    } catch (err: any) {
      toast.error('Failed to load medicines: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Antibiotics',
    'Painkillers',
    'Diabetes',
    'Cardiovascular',
    'Gastrointestinal',
    'Respiratory',
    'Vitamins & Supplements',
  ];

  const filteredMedicines = medications.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      (m.barcode && m.barcode.includes(search));
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCat && m.availableQuantity > 0;
  });

  const handleAddToCart = (med: Medication) => {
    if (med.availableQuantity <= 0) {
      toast.error('Item is currently out of stock.');
      return;
    }

    const item: CartItem = {
      medicationId: med._id,
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      batchNo: med.batchNumber || 'FEFO-Auto',
      pricePerUnit: med.pricePerUnit,
      quantity: 1,
      availableStock: med.availableQuantity,
      prescriptionRequired: med.prescriptionRequired,
    };

    dispatch(addToCart(item));
  };

  const handleConfirmPayment = async () => {
    if (cart.items.length === 0) return;

    setProcessingCheckout(true);
    try {
      const payload = {
        customerName: cart.customerName || 'Walk-in Customer',
        customerPhone: cart.customerPhone || 'N/A',
        items: cart.items.map((i) => ({ medicationId: i.medicationId, quantity: i.quantity })),
        discount: cart.discount,
        paymentMode: cart.paymentMode,
        notes: cart.notes,
      };

      const res = await api.checkout(payload);
      setCompletedSale(res.sale);
      toast.success(`Checkout complete! Invoice: ${res.sale.invoiceNo}`);
      dispatch(clearCart());
      fetchMedicines(); // Refresh stock numbers
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed.');
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Medicine Catalog / Barcode Selection */}
        <div className="lg:w-7/12 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Search & Category Filter Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medication name, generic composition, or scan barcode..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                autoFocus
              />
              <ScanBarcode className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading available medicines...
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                No available in-stock medicines match your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredMedicines.map((med) => (
                  <motion.div
                    key={med._id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddToCart(med)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-sky-400 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-sky-700 leading-tight">
                          {med.name}
                        </h4>
                        {med.prescriptionRequired && (
                          <span className="shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{med.genericName}</p>
                      <div className="text-[10px] text-slate-500 font-medium mt-1">
                        {med.category} • Batch: {med.batchNumber || 'Auto-FEFO'}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(med.pricePerUnit)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">/{med.unit}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                        {med.availableQuantity} in stock
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Shopping Cart & Checkout */}
        <div className="lg:w-5/12 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-900">Current POS Billing Cart</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                {cart.items.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {cart.heldBills.length > 0 && (
                <button
                  onClick={() => setHeldBillsModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Held ({cart.heldBills.length})
                </button>
              )}
              {cart.items.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      dispatch(holdBill());
                      toast.info('Current bill held.');
                    }}
                    className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg"
                    title="Hold Bill"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => dispatch(clearCart())}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                Cart is empty. Select medicines from the left panel to begin.
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.medicationId}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 truncate">{item.name}</span>
                      {item.prescriptionRequired && (
                        <span className="text-[9px] font-bold px-1 rounded bg-rose-100 text-rose-700">
                          Rx
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(item.pricePerUnit)} each • Batch: {item.batchNo}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            medicationId: item.medicationId,
                            quantity: item.quantity - 1,
                          })
                        )
                      }
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="w-7 text-center font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            medicationId: item.medicationId,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      disabled={item.quantity >= item.availableStock}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>

                  {/* Item Subtotal & Delete */}
                  <div className="text-right min-w-[4rem]">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(item.pricePerUnit * item.quantity)}
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCart(item.medicationId))}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Pricing Summary Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={cart.customerName}
                  onChange={(e) => dispatch(setCustomerInfo({ name: e.target.value }))}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Mobile / Phone"
                  value={cart.customerPhone}
                  onChange={(e) => dispatch(setCustomerInfo({ phone: e.target.value }))}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={cart.discount}
                  onChange={(e) => dispatch(setDiscount(Number(e.target.value)))}
                  className="w-20 px-2 py-0.5 bg-white border border-slate-200 rounded text-right font-medium text-xs"
                />
              </div>
              <div className="flex justify-between">
                <span>GST ({cart.taxRate}%):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(cart.tax)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between text-base font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-sky-700">{formatCurrency(cart.total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Card', 'UPI'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => dispatch(setPaymentMode(mode))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    cart.paymentMode === mode
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                  {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                  {mode === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                  {mode}
                </button>
              ))}
            </div>

            {/* Complete Sale Button */}
            <button
              disabled={cart.items.length === 0 || processingCheckout}
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {processingCheckout ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Charge {formatCurrency(cart.total)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Held Bills Modal */}
      <Modal
        isOpen={heldBillsModalOpen}
        onClose={() => setHeldBillsModalOpen(false)}
        title="Held Bills"
        subtitle="Resume previously held billing sessions."
        maxWidth="md"
      >
        <div className="space-y-2">
          {cart.heldBills.map((b) => (
            <div key={b.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-800">{b.customerName}</div>
                <div className="text-[11px] text-slate-400">
                  {b.items.length} items • Held at {b.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{formatCurrency(b.total)}</span>
                <button
                  onClick={() => {
                    dispatch(restoreHeldBill(b.id));
                    setHeldBillsModalOpen(false);
                    toast.success('Bill restored to cart.');
                  }}
                  className="px-2.5 py-1 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700"
                >
                  Restore
                </button>
                <button
                  onClick={() => dispatch(deleteHeldBill(b.id))}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Invoice Modal after Successful Checkout */}
      {completedSale && (
        <Modal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          title="Checkout Completed"
          subtitle={`Invoice ${completedSale.invoiceNo} successfully generated.`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Printable Area */}
            <div className="p-6 bg-slate-50 border rounded-2xl printable-invoice space-y-4 text-xs text-slate-800">
              <div className="text-center pb-3 border-b">
                <h3 className="text-base font-bold text-slate-900">{settings.pharmacyName}</h3>
                <p className="text-[11px] text-slate-500">{settings.address}</p>
                <p className="text-[11px] text-slate-500">Phone: {settings.phone} • GST: {settings.gstNumber}</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <div><strong>Invoice:</strong> {completedSale.invoiceNo}</div>
                  <div><strong>Date:</strong> {formatDateTime(completedSale.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div><strong>Customer:</strong> {completedSale.customerName}</div>
                  <div><strong>Payment:</strong> {completedSale.paymentMode}</div>
                </div>
              </div>

              {/* Items */}
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
                  {completedSale.items.map((i, idx) => (
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

              {/* Totals */}
              <div className="space-y-1 text-right text-xs">
                <div>Subtotal: <strong>{formatCurrency(completedSale.subtotal)}</strong></div>
                {completedSale.discount > 0 && (
                  <div>Discount: <strong>-{formatCurrency(completedSale.discount)}</strong></div>
                )}
                <div>Tax ({settings.taxRate}%): <strong>{formatCurrency(completedSale.tax)}</strong></div>
                <div className="text-sm font-extrabold text-slate-900 pt-1 border-t">
                  Total Paid: {formatCurrency(completedSale.totalAmount)}
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-3 border-t">
                {settings.receiptFooter}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

