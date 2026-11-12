import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StockAlert } from '@/types';

interface NotificationState {
  alerts: StockAlert[];
  unreadCount: number;
}

const initialState: NotificationState = {
  alerts: [],
  unreadCount: 0,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<StockAlert[]>) => {
      state.alerts = action.payload;
      state.unreadCount = action.payload.filter((a) => a.status === 'unread').length;
    },
    addAlert: (state, action: PayloadAction<StockAlert>) => {
      // Check if duplicate unresolved alert exists
      const exists = state.alerts.find(
        (a) => a._id === action.payload._id || (a.message === action.payload.message && a.status === 'unread')
      );
      if (!exists) {
        state.alerts.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    markAlertReadLocally: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a._id === action.payload);
      if (alert && alert.status === 'unread') {
        alert.status = 'read';
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAlertsReadLocally: (state) => {
      state.alerts.forEach((a) => {
        a.status = 'read';
      });
      state.unreadCount = 0;
    },
  },
});

export const { setAlerts, addAlert, markAlertReadLocally, markAllAlertsReadLocally } =
  notificationSlice.actions;

export default notificationSlice.reducer;

