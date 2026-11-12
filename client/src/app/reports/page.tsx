'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  ShoppingBag,
  Shield,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Route guard: Redirect cashiers immediately
  useEffect(() => {
    if (user && !isAdmin) {
      toast.error('Administrative access required to view business reports.');
      router.replace('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchReport();
    }
  }, [period, isAdmin]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReports(period);
      if (res.report) setReport(res.report);
    } catch (err: any) {
      toast.error('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Metric', 'Value'],
      ['Period', period],
      ['Total Revenue', report.totalRevenue],
      ['Total Transactions', report.totalTransactions],
      ['Average Order Value', report.averageOrderValue],
      ['Inventory Cost Valuation', report.inventoryValuation],
      ['Retail Stock Valuation', report.retailValuation],
      [''],
      ['Cashier Leaderboard', 'Sales Count', 'Total Handled'],
      ...(report.cashierPerformance || []).map((c: any) => [c.name, c.salesCount, c.totalAmount]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PharmaCare_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported as CSV.');
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-500 text-sm">
          <Shield className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          Redirecting to dashboard...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Audits</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Financial summaries, inventory valuation, and cashier performance breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="year">Past 365 Days</option>
              <option value="all">All-Time Cumulative</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" /> Print
            </button>
          </div>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Total Revenue</span>
            <div className="text-2xl font-bold text-slate-900">
              {report ? formatCurrency(report.totalRevenue) : '₹0.00'}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Filtered period revenue
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Total Transactions</span>
            <div className="text-2xl font-bold text-slate-900">{report?.totalTransactions || 0}</div>
            <p className="text-[10px] text-slate-400">Completed invoices</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Avg. Basket Size</span>
            <div className="text-2xl font-bold text-slate-900">
              {report ? formatCurrency(report.averageOrderValue) : '₹0.00'}
            </div>
            <p className="text-[10px] text-slate-400">Revenue per transaction</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Inventory Cost Value</span>
            <div className="text-2xl font-bold text-sky-700">
              {report ? formatCurrency(report.inventoryValuation) : '₹0.00'}
            </div>
            <p className="text-[10px] text-slate-400">
              Retail: {report ? formatCurrency(report.retailValuation) : '₹0.00'}
            </p>
          </div>
        </div>

        {/* Cashier Performance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Dispensary Cashier Performance</h3>
            </div>
            <span className="text-xs text-slate-400">{report?.cashierPerformance?.length || 0} staff active</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Computing financial reports...</div>
          ) : !report?.cashierPerformance || report.cashierPerformance.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No sales records in selected period.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Cashier Name</th>
                  <th className="py-3 px-4 text-center">Transactions Handled</th>
                  <th className="py-3 px-4 text-right">Total Revenue Processed</th>
                  <th className="py-3 px-4 text-right">Avg. Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.cashierPerformance.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{c.salesCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(c.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(c.salesCount > 0 ? c.totalAmount / c.salesCount : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
