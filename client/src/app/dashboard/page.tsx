'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShoppingCart,
  PlusCircle,
  FileText,
  BellRing,
  ArrowRight,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DashboardStats } from '@/types';
import { Badge } from '@/components/ui/Badge';

const PAYMENT_COLORS = ['#0ea5e9', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Today's Sales",
      value: stats ? formatCurrency(stats.todaySales) : '₹0.00',
      subtitle: '+12.5% vs yesterday',
      icon: IndianRupee,
      color: 'sky',
      href: '/sales',
    },
    {
      title: 'Total Medicines',
      value: stats ? stats.totalMedicines.toString() : '0',
      subtitle: 'Active clinical catalog',
      icon: Package,
      color: 'indigo',
      href: '/inventory',
    },
    {
      title: 'Total Stock Units',
      value: stats ? stats.totalStockUnits.toLocaleString() : '0',
      subtitle: 'Across all batches',
      icon: Layers,
      color: 'teal',
      href: '/inventory',
    },
    {
      title: 'Low Stock Alert',
      value: stats ? stats.lowStockCount.toString() : '0',
      subtitle: 'Below reorder threshold',
      icon: AlertTriangle,
      color: 'amber',
      badge: stats && stats.lowStockCount > 0 ? 'Action Needed' : undefined,
      href: '/inventory?status=Low+Stock',
    },
    {
      title: 'Expiring Soon',
      value: stats ? stats.expiringSoonCount.toString() : '0',
      subtitle: 'Within next 30 days',
      icon: Clock,
      color: 'rose',
      badge: stats && stats.expiringSoonCount > 0 ? 'Review Batches' : undefined,
      href: '/expiry?range=30',
    },
    {
      title: "Today's Invoices",
      value: stats ? stats.todayTransactions.toString() : '0',
      subtitle: 'Completed checkouts',
      icon: Receipt,
      color: 'emerald',
      href: '/sales',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-7">
        {/* Welcome Banner & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              PharmaCare Command Center
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live overview of inventory levels, POS sales transactions, and compliance alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all"
            >
              <ShoppingCart className="w-4 h-4" /> New POS Bill
            </Link>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" /> Add Medicine
            </Link>
            <Link
              href="/purchases"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
            >
              <FileText className="w-4 h-4 text-slate-500" /> New Purchase
            </Link>
          </div>
        </div>

        {/* 6 Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                <Link
                  href={card.href}
                  className="block p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 transition-all group h-full"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-${card.color}-600 bg-${card.color}-50 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? (
                      <div className="w-16 h-6 bg-slate-100 rounded animate-pulse" />
                    ) : (
                      card.value
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{card.subtitle}</span>
                    {card.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {card.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section: Weekly Sales & Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Sales Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Weekly Sales Overview</h3>
                <p className="text-xs text-slate-500">Revenue aggregated over the last 7 calendar days</p>
              </div>
              <Link href="/reports" className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1">
                Full Report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-64 w-full">
              {stats?.weeklySales ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklySales}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, 'Sales']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Bar dataKey="amount" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Sales by Payment Mode</h3>
              <p className="text-xs text-slate-500 mb-2">Cash vs Card vs UPI payment distribution</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              {stats?.paymentData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {stats.paymentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, 'Total']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">Loading breakdown...</div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-around text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-sky-600" /> Cash</span>
              <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Card</span>
              <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-amber-500" /> UPI</span>
            </div>
          </div>
        </div>

        {/* Lower Section: Real-time Alerts & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Critical Stock & Expiry Alerts</h3>
                  <p className="text-[11px] text-slate-500">Real-time alerts requiring pharmacist review</p>
                </div>
              </div>
              <Link href="/notifications" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats?.activeAlerts && stats.activeAlerts.length > 0 ? (
                stats.activeAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">{alert.message}</div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(alert.createdAt)}</div>
                    </div>
                    <Link
                      href="/inventory"
                      className="shrink-0 px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg text-[10px] transition-colors"
                    >
                      Reorder Stock
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  All stock thresholds are currently in good standing.
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales Activity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Recent Sales Activity</h3>
                  <p className="text-[11px] text-slate-500">Latest completed Point of Sale transactions</p>
                </div>
              </div>
              <Link href="/sales" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
                View History
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <div key={sale._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{sale.invoiceNo}</div>
                      <div className="text-slate-400 text-[11px]">
                        {sale.customerName || 'Walk-in'} • {sale.paymentMode} • {formatDateTime(sale.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(sale.totalAmount)}</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">No recent sales records.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

