'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { User } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useAppSelector } from '@/store/hooks';

export default function StaffPage() {
  const router = useRouter();
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

  // Route guard: Redirect cashiers immediately
  useEffect(() => {
    if (currentUser && !isAdmin) {
      toast.error('Administrative access required to view staff management.');
      router.replace('/dashboard');
    }
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

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

  const handleDeleteStaff = async (staff: User) => {
    if (staff.id === currentUser?.id) {
      toast.error('Administrators cannot delete their own account.');
      return;
    }
    if (confirm(`Permanently remove staff account for ${staff.name}?`)) {
      try {
        await api.deleteStaff(staff.id);
        toast.info(`Staff account for ${staff.name} deleted.`);
        fetchStaff();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete staff account.');
      }
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Management & Access Control</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage pharmacist accounts, cashier logins, password resets, and role assignments.
            </p>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading staff records...</div>
          ) : staffList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No staff members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{staff.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            staff.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {staff.role === 'admin' ? 'Administrator' : 'Cashier / Dispensary'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {staff.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-medium text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {staff.createdAt ? formatDateTime(staff.createdAt) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setResetModalOpen(true);
                            }}
                            title="Reset Password"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            title={staff.isActive ? 'Deactivate Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              staff.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {staff.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          {staff.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              title="Delete Account"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Staff Modal */}
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Create Staff Account"
          subtitle="Add a new pharmacist or dispensary cashier to PharmaCare."
          maxWidth="md"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newStaffData.name}
                onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                placeholder="e.g. Dr. Rajesh Kumar"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newStaffData.email}
                onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                placeholder="rajesh@pharmacare.io"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
              <input
                type="password"
                required
                value={newStaffData.password}
                onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Access Role</label>
              <select
                value={newStaffData.role}
                onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="cashier">Cashier / Dispensary (POS Billing & Inventory View)</option>
                <option value="admin">Administrator (Full Administrative Access)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-semibold"
              >
                Create Account
              </button>
            </div>
          </form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title={`Reset Password for ${selectedStaff?.name}`}
          subtitle="Set a new administrative override password for this staff member."
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3.5 py-1.5 border rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-semibold"
              >
                Save New Password
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
