'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  CheckCheck,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { markAlertReadLocally, markAllAlertsReadLocally } from '@/store/notificationSlice';
import { api } from '@/lib/api';
import { GlobalSearchModal } from './GlobalSearchModal';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { alerts, unreadCount } = useAppSelector((state) => state.notifications);

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/inventory')) return 'Inventory Management';
    if (pathname.startsWith('/billing')) return 'Point of Sale (POS)';
    if (pathname.startsWith('/sales')) return 'Sales & Invoices';
    if (pathname.startsWith('/suppliers')) return 'Suppliers';
    if (pathname.startsWith('/purchases')) return 'Purchase Orders';
    if (pathname.startsWith('/expiry')) return 'Expiry Management';
    if (pathname.startsWith('/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/notifications')) return 'Notification Center';
    if (pathname.startsWith('/staff')) return 'Staff Management';
    if (pathname.startsWith('/settings')) return 'Application Settings';
    return 'PharmaCare';
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      dispatch(markAllAlertsReadLocally());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAlertClick = async (alertId: string) => {
    try {
      await api.markAlertRead(alertId);
      dispatch(markAlertReadLocally(alertId));
      setNotifDropdownOpen(false);
      router.push('/notifications');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between transition-all">
        {/* Left Side: Mobile Menu & Breadcrumb Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Side: Global Search + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-500 hover:text-slate-700 text-xs sm:text-sm rounded-xl transition-all shadow-sm"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Quick search medicines, batches...</span>
            <span className="md:hidden">Search</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-500 shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Notifications Bell & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No current notifications
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((a) => (
                      <div
                        key={a._id}
                        onClick={() => handleAlertClick(a._id)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs flex gap-3 ${
                          a.status === 'unread' ? 'bg-sky-50/40' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            a.status === 'unread' ? 'bg-rose-500' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-slate-800 leading-snug">{a.message}</p>
                          <span className="text-[10px] text-slate-400 block">
                            {formatDateTime(a.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                  <Link
                    href="/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name || 'Pharmacist'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 capitalize">
                  {user?.role || 'staff'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 capitalize">
                    <Shield className="w-3 h-3" /> {user?.role} Account
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5 text-xs font-medium text-slate-700">
                  <Link
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" /> Account Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" /> My Profile
                  </Link>
                </div>

                <div className="p-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      dispatch(logout());
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

