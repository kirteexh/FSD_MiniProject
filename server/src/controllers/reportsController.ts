import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';

export const getReports = async (req: Request, res: Response) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month', 'year', 'all'
    const sales = await dbStore.getSales({});
    const meds = await dbStore.getMedications({});
    const users = await dbStore.getUsers();

    const now = new Date();
    let startDate = new Date(0);

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const filteredSales = sales.filter((s) => new Date(s.createdAt) >= startDate && s.status === 'completed');

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalTransactions = filteredSales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Inventory Valuation
    const inventoryValuation = meds.reduce((sum, m) => sum + m.availableQuantity * (m.purchasePrice || 0), 0);
    const retailValuation = meds.reduce((sum, m) => sum + m.availableQuantity * (m.pricePerUnit || 0), 0);

    // Cashier performance
    const cashierStatsMap: Record<string, { name: string; salesCount: number; totalAmount: number }> = {};
    filteredSales.forEach((s) => {
      const cashierName = s.cashierId?.name || 'Unknown Cashier';
      if (!cashierStatsMap[cashierName]) {
        cashierStatsMap[cashierName] = { name: cashierName, salesCount: 0, totalAmount: 0 };
      }
      cashierStatsMap[cashierName].salesCount += 1;
      cashierStatsMap[cashierName].totalAmount += s.totalAmount;
    });

    const cashierPerformance = Object.values(cashierStatsMap).sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      report: {
        period: period || 'all',
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        inventoryValuation: Math.round(inventoryValuation * 100) / 100,
        retailValuation: Math.round(retailValuation * 100) / 100,
        cashierPerformance,
        salesCount: filteredSales.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

