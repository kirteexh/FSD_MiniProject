'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

export default function ReportsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

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
      ['Retail Catalog Valuation', report.retailValuation],
      [],
      ['Cashier', 'Sales Count', 'Total Billed'],
      ...(report.cashierPerformance?.map((c: any) => [c.name, c.salesCount, c.totalAmount]) || []),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PharmaCare_Financial_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV!');
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-500 text-sm">
          Access Denied. Financial reports are restricted to Administrative users.
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Clinical Analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited revenue reports, inventory valuations, order values, and cashier performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-600" /> Print Report
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex gap-2 border-b pb-3">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'Last 30 Days' },
            { id: 'year', label: 'Past 12 Months' },
            { id: 'all', label: 'All-Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Period Revenue</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {report ? formatCurrency(report.totalRevenue) : '₹0.00'}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Billed to patients</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Total Transactions</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {report ? report.totalTransactions : 0}
            </div>
            <span className="text-[11px] text-slate-400">Completed invoices</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Average Order Value</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {report ? formatCurrency(report.averageOrderValue) : '₹0.00'}
            </div>
            <span className="text-[11px] text-slate-400">Per patient ticket</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Inventory Valuation</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {report ? formatCurrency(report.inventoryValuation) : '₹0.00'}
            </div>
            <span className="text-[11px] text-slate-400">At distributor cost</span>
          </div>
        </div>

        {/* Cashier Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cashier Sales Performance</h3>
              <p className="text-xs text-slate-500">Summary of invoices and revenue processed by staff members</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Cashier</th>
                  <th className="px-4 py-3">Transactions Completed</th>
                  <th className="px-4 py-3">Total Billed Revenue</th>
                  <th className="px-4 py-3 text-right">Avg / Sale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.cashierPerformance?.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      {c.name}
                    </td>
                    <td className="px-4 py-3 font-semibold">{c.salesCount}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{formatCurrency(c.totalAmount)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">
                      {formatCurrency(c.totalAmount / (c.salesCount || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

