'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  KeyRound,
  CheckCircle,
  XCircle,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { User } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

export default function StaffPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isAdmin = currentUser?.role === 'admin';

  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  // Forms
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.getStaff();
      if (res.users) setStaffList(res.users);
    } catch (err: any) {
      toast.error('Failed to load staff list: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaff(newStaffData);
      toast.success(`Staff account created for ${newStaffData.name}!`);
      setAddModalOpen(false);
      setNewStaffData({ name: '', email: '', password: '', role: 'cashier' });
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff account.');
    }
  };

  const handleToggleStatus = async (staff: User) => {
    try {
      await api.updateStaff(staff.id, { isActive: !staff.isActive });
      toast.info(`Account status updated for ${staff.name}`);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await api.resetStaffPassword(selectedStaff.id, newPassword);
      toast.success(`Password updated for ${selectedStaff.name}!`);
      setResetModalOpen(false);
      setNewPassword('');
      setSelectedStaff(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-500 text-sm">
          <Shield className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          Access Denied. Administrative privileges required to manage staff accounts.
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff & RBAC Accounts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control system access, provision cashier permissions, and maintain audit logs.
            </p>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Provision New Staff
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b">
                <tr>
                  <th className="px-5 py-3.5">Staff Name</th>
                  <th className="px-4 py-3.5">Email Identifier</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5">Date Created</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading staff records...
                    </td>
                  </tr>
                ) : (
                  staffList.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        {member.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{member.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            member.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            member.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDateTime(member.createdAt)}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDateTime(member.lastLogin)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            member.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={member.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {member.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setResetModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Provision Staff Account"
        subtitle="Create credentials for pharmacy cashiers or administrators."
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={newStaffData.name}
              onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
              placeholder="e.g. Rajesh Verma"
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
            <input
              type="email"
              required
              value={newStaffData.email}
              onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
              placeholder="e.g. rajesh@pharmacare.io"
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Password *</label>
            <input
              type="password"
              required
              value={newStaffData.password}
              onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Permissions *</label>
            <select
              value={newStaffData.role}
              onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
            >
              <option value="cashier">Cashier (POS Billing, Inventory View)</option>
              <option value="admin">Administrator (Full Control, Reports, Staff)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {selectedStaff && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title={`Reset Password for ${selectedStaff.name}`}
          subtitle="Enter a new secure password for this user."
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
              >
                Update Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}

