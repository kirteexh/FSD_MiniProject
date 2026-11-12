'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { markAlertReadLocally, markAllAlertsReadLocally } from '@/store/notificationSlice';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { alerts, unreadCount } = useAppSelector((state) => state.notifications);
  const [filterType, setFilterType] = useState('ALL');

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      dispatch(markAllAlertsReadLocally());
      toast.success('All alerts marked as read.');
    } catch (err: any) {
      toast.error('Failed to mark all as read: ' + err.message);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markAlertRead(id);
      dispatch(markAlertReadLocally(id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.alertType === filterType;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live WebSocket inventory alerts, critical thresholds, and clinical updates.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-sky-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b pb-3">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
            { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterType === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No notifications matching the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  alert.status === 'unread' ? 'bg-sky-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.alertType === 'LOW_STOCK'
                        ? 'bg-amber-100 text-amber-700'
                        : alert.alertType === 'EXPIRED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {alert.alertType === 'LOW_STOCK' && <AlertTriangle className="w-5 h-5" />}
                    {alert.alertType === 'EXPIRING_SOON' && <Clock className="w-5 h-5" />}
                    {alert.alertType === 'EXPIRED' && <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {alert.alertType.replace('_', ' ')}
                      </span>
                      {alert.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {formatDateTime(alert.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/inventory?search=${encodeURIComponent(alert.medicationId?.name || '')}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Medicine
                  </Link>
                  {alert.status === 'unread' && (
                    <button
                      onClick={() => handleMarkRead(alert._id)}
                      className="px-3 py-1.5 text-sky-600 hover:text-sky-800 text-xs font-semibold"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

