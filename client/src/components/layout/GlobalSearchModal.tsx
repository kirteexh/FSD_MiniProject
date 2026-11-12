'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Receipt, ArrowRight, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMedications([]);
      setSales([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setMedications([]);
      setSales([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [medRes, saleRes] = await Promise.all([
          api.getMedications({ search: query }).catch(() => ({ medications: [] })),
          api.getSales({ search: query }).catch(() => ({ sales: [] })),
        ]);
        setMedications(medRes.medications?.slice(0, 5) || []);
        setSales(saleRes.sales?.slice(0, 5) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectMedicine = (med: any) => {
    onClose();
    router.push(`/inventory?search=${encodeURIComponent(med.name)}`);
  };

  const handleSelectSale = (sale: any) => {
    onClose();
    router.push(`/sales?search=${encodeURIComponent(sale.invoiceNo)}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Quick Search" maxWidth="xl">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type medicine name, barcode, batch, or invoice number..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all shadow-inner"
            autoFocus
          />
          {loading && (
            <Loader2 className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-600 animate-spin" />
          )}
        </div>

        {/* Results */}
        {query.trim() !== '' && (
          <div className="space-y-4 pt-1 max-h-96 overflow-y-auto">
            {/* Medicines */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Medicines & Batches
              </div>
              {medications.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-1">No medicines matching query</p>
              ) : (
                <div className="space-y-1">
                  {medications.map((med) => (
                    <div
                      key={med._id}
                      onClick={() => handleSelectMedicine(med)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50 cursor-pointer border border-transparent hover:border-sky-200 transition-all text-sm group"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-sky-700">
                          {med.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {med.genericName} • {med.category} • Batch: {med.batchNumber || 'N/A'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {med.availableQuantity} in stock
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Invoices & Sales
              </div>
              {sales.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-1">No sales matching query</p>
              ) : (
                <div className="space-y-1">
                  {sales.map((sale) => (
                    <div
                      key={sale._id}
                      onClick={() => handleSelectSale(sale)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50 cursor-pointer border border-transparent hover:border-sky-200 transition-all text-sm group"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-sky-700">
                          {sale.invoiceNo}
                        </div>
                        <div className="text-xs text-slate-400">
                          {sale.customerName} • {sale.paymentMode} • {sale.items?.length || 0} items
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-sky-700">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Shortcut */}
        <div className="pt-2 border-t text-[11px] text-slate-400 flex items-center justify-between">
          <span>Search automatically queries medicines, barcodes, batches and receipts.</span>
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">ESC to close</span>
        </div>
      </div>
    </Modal>
  );
};

