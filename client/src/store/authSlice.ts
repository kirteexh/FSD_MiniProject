import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

const isTokenValid = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacare_token', action.payload.token);
        localStorage.setItem('pharmacare_user', JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pharmacare_token');
        localStorage.removeItem('pharmacare_user');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    restoreSession: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('pharmacare_token');
        const userStr = localStorage.getItem('pharmacare_user');
        if (token && userStr && isTokenValid(token)) {
          try {
            state.token = token;
            state.user = JSON.parse(userStr);
            state.isAuthenticated = true;
          } catch {
            localStorage.removeItem('pharmacare_token');
            localStorage.removeItem('pharmacare_user');
          }
        } else if (token) {
          // Clean up expired token
          localStorage.removeItem('pharmacare_token');
          localStorage.removeItem('pharmacare_user');
        }
      }
      state.loading = false;
    },
  },
});

export const { setCredentials, logout, setLoading, restoreSession } = authSlice.actions;
export default authSlice.reducer;
