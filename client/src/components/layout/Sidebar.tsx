'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  ClipboardList,
  CalendarClock,
  BarChart3,
  Bell,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const [helpOpen, setHelpOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Billing / POS', href: '/billing', icon: ShoppingCart },
    { name: 'Sales History', href: '/sales', icon: Receipt },
    { name: 'Suppliers', href: '/suppliers', icon: Truck },
    { name: 'Purchases', href: '/purchases', icon: ClipboardList },
    { name: 'Expiry Management', href: '/expiry', icon: CalendarClock },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, adminOnly: true },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: 'Staff Management', href: '/staff', icon: Users, adminOnly: true },
  ];

  const handleLogout = () => {
    dispatch(logout());
    toast.info('You have been signed out.');
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Pharma<span className="text-sky-600">Care</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-1">
                  Management
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-600 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {item.badge !== undefined && (
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                      collapsed ? 'absolute -top-1 -right-1 ring-2 ring-white' : ''
                    } bg-rose-500 text-white animate-pulse`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              pathname === '/settings'
                ? 'bg-sky-50 text-sky-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 shrink-0 text-slate-400" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={() => setHelpOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title={collapsed ? 'Help & Support' : undefined}
          >
            <HelpCircle className="w-5 h-5 shrink-0 text-slate-400" />
            {!collapsed && <span>Help & Support</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0 text-rose-500" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Help Modal */}
      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="PharmaCare Help & Quick Guide" maxWidth="md">
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900 text-xs">
            <strong>System Overview:</strong> PharmaCare manages real-time medicines inventory, FEFO-based Point of Sale billing, automated low-stock and expiry alerts, and supplier purchase orders.
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Key Shortcuts & Tips:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Click on the search bar in the top navigation bar or press <strong>Ctrl + K</strong> to search medicines instantly.</li>
              <li>In Billing / POS, inventory is automatically deducted based on FEFO (earliest expiry first).</li>
              <li>Staff accounts and financial analytics are restricted to Admin role.</li>
              <li>Real-time notifications will pop up when stocks drop below reorder thresholds.</li>
            </ul>
          </div>
          <div className="pt-2 text-xs text-slate-400 border-t">
            For support or questions, contact IT Administration: <span className="text-slate-600">support@pharmacare.io</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

