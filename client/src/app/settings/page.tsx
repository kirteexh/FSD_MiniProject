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
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setActiveTab('account');
    }
  }, [isAdmin]);

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

    setChangingPass(true);
    try {
      await api.changePassword({ currentPassword: currentPass, newPassword: newPass });
      toast.success('Password changed successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
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
            ...(isAdmin
              ? [
                  { id: 'profile', label: 'Pharmacy Profile', icon: Building2 },
                  { id: 'business', label: 'Business & Tax', icon: Sliders },
                  { id: 'inventory', label: 'Inventory Rules', icon: Bell },
                ]
              : []),
            { id: 'account', label: 'My Account & Security', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white border text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        {activeTab === 'profile' && isAdmin && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Clinic & Pharmacy Branding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pharmacy Name</label>
                <input
                  type="text"
                  value={formData.pharmacyName || ''}
                  onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (India)</label>
                <input
                  type="text"
                  value={formData.gstNumber || ''}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Clinic Address</label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Thermal Footer Message</label>
              <textarea
                rows={2}
                value={formData.receiptFooter || ''}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </form>
        )}

        {activeTab === 'business' && isAdmin && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Tax Rates & Invoicing Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.taxRate || 5}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoicePrefix || 'INV-2026-'}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  disabled
                  value={formData.currency || 'INR'}
                  className="w-full px-3 py-2 bg-slate-100 border rounded-xl cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  disabled
                  value={formData.currencySymbol || '₹'}
                  className="w-full px-3 py-2 bg-slate-100 border rounded-xl cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
              >
                <Save className="w-4 h-4" /> Save Business Rules
              </button>
            </div>
          </form>
        )}

        {activeTab === 'inventory' && isAdmin && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Inventory Alerting & Expiry Windows</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Low Stock Reorder Threshold</label>
                <input
                  type="number"
                  value={formData.defaultReorderThreshold || 20}
                  onChange={(e) => setFormData({ ...formData, defaultReorderThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Triggers WebSocket notification when units drop below this number.</span>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expiry Alert Lookahead (Days)</label>
                <input
                  type="number"
                  value={formData.expiryAlertDays || 60}
                  onChange={(e) => setFormData({ ...formData, expiryAlertDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Items expiring within this period appear as &apos;Expiring Soon&apos;.</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
              >
                <Save className="w-4 h-4" /> Save Inventory Rules
              </button>
            </div>
          </form>
        )}

        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Current Session</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Logged In As</span>
                  <span className="font-bold text-slate-800 text-sm">{user?.name}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Role</span>
                  <span className="font-bold text-sky-700 text-sm uppercase">{user?.role}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
