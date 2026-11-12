import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Settings } from '@/types';

interface SettingsState {
  settings: Settings;
  theme: 'light' | 'dark';
}

const defaultSettings: Settings = {
  pharmacyName: 'PharmaCare Chemist & Druggist',
  phone: '+91 98201 23456',
  email: 'care@pharmacare.in',
  address: 'Shop No. 4, Shree Ganesh Complex, MG Road, Dadar West, Mumbai, MH - 400028',
  gstNumber: '27AABCP1234F1Z8',
  currency: 'INR',
  currencySymbol: '₹',
  taxRate: 5,
  invoicePrefix: 'INV-2026-',
  receiptFooter: 'Thank you for choosing PharmaCare Chemist. Get well soon! (Medicines returnable within 7 days with original cash memo).',
  defaultReorderThreshold: 20,
  expiryAlertDays: 60,
};

const initialState: SettingsState = {
  settings: defaultSettings,
  theme: 'light',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setSettings, toggleTheme } = settingsSlice.actions;
export default settingsSlice.reducer;

