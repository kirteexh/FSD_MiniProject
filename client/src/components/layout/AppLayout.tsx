'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { getSocket } from '@/lib/socket';
import { addAlert, setAlerts } from '@/store/notificationSlice';
import { toast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Initial load of alerts & setup Socket.IO
  useEffect(() => {
    if (isAuthenticated) {
      api.getAlerts()
        .then((res) => {
          if (res.alerts) dispatch(setAlerts(res.alerts));
        })
        .catch(console.error);

      // Connect Socket.IO
      const socket = getSocket();

      const handleStockAlert = (alertData: any) => {
        dispatch(addAlert(alertData));
        toast.warning(alertData.message || 'New Inventory Stock Alert!');
      };

      const handleSaleCompleted = (saleData: any) => {
        toast.success(`Sale completed: ${saleData.invoiceNo} (₹${saleData.totalAmount})`);
      };

      const handlePurchaseReceived = (purchaseData: any) => {
        toast.info(`Stock received for Purchase Order: ${purchaseData.purchaseNo}`);
      };

      socket.on('stock_alert', handleStockAlert);
      socket.on('sale_completed', handleSaleCompleted);
      socket.on('purchase_received', handlePurchaseReceived);

      return () => {
        socket.off('stock_alert', handleStockAlert);
        socket.off('sale_completed', handleSaleCompleted);
        socket.off('purchase_received', handlePurchaseReceived);
      };
    }
  }, [isAuthenticated, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

