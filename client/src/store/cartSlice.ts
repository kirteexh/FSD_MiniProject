import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '@/types';

export interface HeldBills {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  prescriptionNumber?: string;
  doctorName?: string;
  patientName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  prescriptionNumber: string;
  doctorName: string;
  patientName: string;
  discount: number;
  taxRate: number; // in percentage e.g. 5
  subtotal: number;
  tax: number;
  total: number;
  paymentMode: 'Cash' | 'Card' | 'UPI';
  notes: string;
  heldBills: HeldBills[];
}

const loadHeldBills = (): HeldBills[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('pharmacare_held_bills');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
};

const saveHeldBills = (bills: HeldBills[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pharmacare_held_bills', JSON.stringify(bills));
    } catch {
      // ignore
    }
  }
};

const calculateTotals = (items: CartItem[], discount: number, taxRate: number) => {
  const subtotal = Math.round(
    (items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0) + Number.EPSILON) * 100
  ) / 100;
  const taxable = Math.max(0, Math.round((subtotal - discount + Number.EPSILON) * 100) / 100);
  const tax = Math.round((((taxable * taxRate) / 100) + Number.EPSILON) * 100) / 100;
  const total = Math.round((taxable + tax + Number.EPSILON) * 100) / 100;
  return { subtotal, tax, total };
};

const initialState: CartState = {
  items: [],
  customerName: '',
  customerPhone: '',
  prescriptionNumber: '',
  doctorName: '',
  patientName: '',
  discount: 0,
  taxRate: 5,
  subtotal: 0,
  tax: 0,
  total: 0,
  paymentMode: 'Cash',
  notes: '',
  heldBills: loadHeldBills(),
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((i) => i.medicationId === action.payload.medicationId);
      if (existing) {
        if (existing.quantity < existing.availableStock) {
          existing.quantity += 1;
        }
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      const totals = calculateTotals(state.items, state.discount, state.taxRate);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    updateQuantity: (state, action: PayloadAction<{ medicationId: string; quantity: number }>) => {
      const item = state.items.find((i) => i.medicationId === action.payload.medicationId);
      if (item) {
        const qty = Math.max(1, Math.min(item.availableStock, action.payload.quantity));
        item.quantity = qty;
      }
      const totals = calculateTotals(state.items, state.discount, state.taxRate);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.medicationId !== action.payload);
      const totals = calculateTotals(state.items, state.discount, state.taxRate);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = Math.max(0, action.payload);
      const totals = calculateTotals(state.items, state.discount, state.taxRate);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    setTaxRate: (state, action: PayloadAction<number>) => {
      state.taxRate = Math.max(0, action.payload);
      const totals = calculateTotals(state.items, state.discount, state.taxRate);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    setCustomerInfo: (
      state,
      action: PayloadAction<{
        name?: string;
        phone?: string;
        notes?: string;
        prescriptionNumber?: string;
        doctorName?: string;
        patientName?: string;
      }>
    ) => {
      if (action.payload.name !== undefined) state.customerName = action.payload.name;
      if (action.payload.phone !== undefined) state.customerPhone = action.payload.phone;
      if (action.payload.notes !== undefined) state.notes = action.payload.notes;
      if (action.payload.prescriptionNumber !== undefined) state.prescriptionNumber = action.payload.prescriptionNumber;
      if (action.payload.doctorName !== undefined) state.doctorName = action.payload.doctorName;
      if (action.payload.patientName !== undefined) state.patientName = action.payload.patientName;
    },
    setPaymentMode: (state, action: PayloadAction<'Cash' | 'Card' | 'UPI'>) => {
      state.paymentMode = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.customerName = '';
      state.customerPhone = '';
      state.prescriptionNumber = '';
      state.doctorName = '';
      state.patientName = '';
      state.discount = 0;
      state.notes = '';
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
    },
    holdBill: (state) => {
      if (state.items.length === 0) return;
      const held: HeldBills = {
        id: 'HOLD-' + Date.now(),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: state.customerName || 'Walk-in Customer',
        customerPhone: state.customerPhone,
        prescriptionNumber: state.prescriptionNumber,
        doctorName: state.doctorName,
        patientName: state.patientName,
        items: [...state.items],
        subtotal: state.subtotal,
        discount: state.discount,
        tax: state.tax,
        total: state.total,
      };
      state.heldBills.unshift(held);
      saveHeldBills(state.heldBills);

      // Reset current cart
      state.items = [];
      state.customerName = '';
      state.customerPhone = '';
      state.prescriptionNumber = '';
      state.doctorName = '';
      state.patientName = '';
      state.discount = 0;
      state.notes = '';
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
    },
    restoreHeldBill: (state, action: PayloadAction<string>) => {
      const index = state.heldBills.findIndex((b) => b.id === action.payload);
      if (index !== -1) {
        const held = state.heldBills[index];
        state.items = held.items;
        state.customerName = held.customerName;
        state.customerPhone = held.customerPhone;
        state.prescriptionNumber = held.prescriptionNumber || '';
        state.doctorName = held.doctorName || '';
        state.patientName = held.patientName || '';
        state.discount = held.discount;
        state.subtotal = held.subtotal;
        state.tax = held.tax;
        state.total = held.total;
        state.heldBills.splice(index, 1);
        saveHeldBills(state.heldBills);
      }
    },
    deleteHeldBill: (state, action: PayloadAction<string>) => {
      state.heldBills = state.heldBills.filter((b) => b.id !== action.payload);
      saveHeldBills(state.heldBills);
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  setDiscount,
  setTaxRate,
  setCustomerInfo,
  setPaymentMode,
  clearCart,
  holdBill,
  restoreHeldBill,
  deleteHeldBill,
} = cartSlice.actions;

export default cartSlice.reducer;
