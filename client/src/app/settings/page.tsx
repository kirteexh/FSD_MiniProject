'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sliders,
  Bell,
  User,
  Shield,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Settings } from '@/types';
import { toast } from '@/components/ui/Toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSettings } from '@/store/settingsSlice';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const currentSettings = useAppSelector((state) => state.settings.settings);
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'inventory' | 'account'>('profile');
  const [formData, setFormData] = useState<Settings>(currentSettings);
  const [saving, setSaving] = useState(false);

  // Change password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.settings) {
          setFormData(res.settings);
          dispatch(setSettings(res.settings));
        }
      })
      .catch(console.error);
  }, [dispatch]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only administrators can update global configuration.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateSettings(formData);
      dispatch(setSettings(res.settings));
      toast.success('Configuration saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      if (user?.id) {
        await api.resetStaffPassword(user.id, newPass);
        toast.success('Password changed successfully!');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clinic profile, receipt footer, tax rates, inventory thresholds, and credentials.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b pb-3">
          {[
            { id: 'profile', label: 'Pharmacy Profile', icon: Building2 },
            { id: 'business', label: 'Business & Tax', icon: Sliders },
            { id: 'inventory', label: 'Inventory Rules', icon: Bell },
            { id: 'account', label: 'My Account & Security', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white border text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Clinic & Pharmacy Information</h3>
              <p className="text-xs text-slate-500">Displayed on printed invoices and legal receipts.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacy Name</label>
                  <input
                    type="text"
                    value={formData.pharmacyName}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST / License No.</label>
                  <input
                    type="text"
                    value={formData.gstNumber || ''}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'business' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Financial & Invoice Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={formData.currencySymbol}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
                  <input
                    type="text"
                    value={formData.receiptFooter}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Financial Config
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'inventory' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Inventory Alert Windows</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Reorder Threshold (Units)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultReorderThreshold}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, defaultReorderThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Alert Threshold (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.expiryAlertDays}
                    disabled={!isAdmin}
                    onChange={(e) => setFormData({ ...formData, expiryAlertDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Inventory Rules
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border space-y-1">
                <span className="text-xs font-semibold text-slate-500">Currently Logged In As</span>
                <div className="font-bold text-sm text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-600">{user?.email} • Role: {user?.role}</div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Change Password</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Update My Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

