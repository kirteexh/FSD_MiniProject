const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // If running in browser and NOT localhost, always route to Render live backend
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return (
        process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')
          ? process.env.NEXT_PUBLIC_API_URL
          : 'https://fsd-miniproject-skab.onrender.com/api'
      );
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pharmacare_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pharmacare_token');
      localStorage.removeItem('pharmacare_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // AUTH
  login: (credentials: { email: string; password: string }) =>
    fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(handleResponse<{ success: boolean; token: string; user: any }>),

  googleLogin: (payload: { email: string; name?: string; googleId?: string }) =>
    fetch(`${getApiBaseUrl()}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse<{ success: boolean; token: string; user: any }>),

  getMe: () =>
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; user: any }>),

  forgotPassword: (email: string) =>
    fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(handleResponse<{ success: boolean; message: string }>),

  resetPassword: (payload: { email: string; resetToken: string; newPassword: string }) =>
    fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse<{ success: boolean; message: string }>),

  logout: () =>
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string }>),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse<{ success: boolean; message: string }>),

  // DASHBOARD
  getDashboardStats: () =>
    fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; stats: any }>),

  // INVENTORY
  getMedications: (params?: { search?: string; category?: string; status?: string }) => {
    const url = new URL(`${API_BASE_URL}/inventory`);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.category) url.searchParams.set('category', params.category);
    if (params?.status) url.searchParams.set('status', params.status);
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(
      handleResponse<{ success: boolean; count: number; medications: any[] }>
    );
  },

  getMedicationById: (id: string) =>
    fetch(`${API_BASE_URL}/inventory/${id}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; medication: any }>),

  getMedicationByBarcode: (code: string) =>
    fetch(`${API_BASE_URL}/inventory/barcode/${encodeURIComponent(code)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; medication: any }>),

  createMedication: (data: any) =>
    fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; medication: any; batch: any }>),

  updateMedication: (id: string, updates: any) =>
    fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse<{ success: boolean; medication: any }>),

  archiveMedication: (id: string) =>
    fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string }>),

  addBatch: (medicationId: string, data: any) =>
    fetch(`${API_BASE_URL}/inventory/${medicationId}/batches`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; batch: any }>),

  adjustStock: (medicationId: string, payload: { batchId: string; quantityChange: number; reason: string }) =>
    fetch(`${API_BASE_URL}/inventory/${medicationId}/adjust`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse<{ success: boolean; batch: any }>),

  // BILLING
  checkout: (payload: {
    customerName?: string;
    customerPhone?: string;
    items: { medicationId: string; quantity: number }[];
    discount?: number;
    paymentMode: string;
    notes?: string;
    prescription?: {
      prescriptionNumber?: string;
      doctorName?: string;
      patientName?: string;
    };
  }) =>
    fetch(`${API_BASE_URL}/billing/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse<{ success: boolean; message: string; sale: any }>),

  // SALES
  getSales: (params?: { search?: string; status?: string; paymentMode?: string }) => {
    const url = new URL(`${API_BASE_URL}/sales`);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.paymentMode) url.searchParams.set('paymentMode', params.paymentMode);
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(
      handleResponse<{ success: boolean; count: number; sales: any[] }>
    );
  },

  getSaleById: (id: string) =>
    fetch(`${API_BASE_URL}/sales/${id}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; sale: any }>),

  returnSale: (id: string, reason: string, items?: { batchId: string; quantity: number }[]) =>
    fetch(`${API_BASE_URL}/sales/${id}/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, items }),
    }).then(handleResponse<{ success: boolean; message: string; sale: any }>),

  // SUPPLIERS
  getSuppliers: () =>
    fetch(`${API_BASE_URL}/suppliers`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; count: number; suppliers: any[] }>),

  getSupplierById: (id: string) =>
    fetch(`${API_BASE_URL}/suppliers/${id}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; supplier: any }>),

  createSupplier: (data: any) =>
    fetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; supplier: any }>),

  updateSupplier: (id: string, updates: any) =>
    fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse<{ success: boolean; supplier: any }>),

  deleteSupplier: (id: string) =>
    fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string }>),

  // PURCHASES
  getPurchases: () =>
    fetch(`${API_BASE_URL}/purchases`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; count: number; purchases: any[] }>),

  createPurchase: (data: any) =>
    fetch(`${API_BASE_URL}/purchases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; purchase: any }>),

  updatePurchase: (id: string, data: any) =>
    fetch(`${API_BASE_URL}/purchases/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; purchase: any }>),

  cancelPurchase: (id: string) =>
    fetch(`${API_BASE_URL}/purchases/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string }>),

  receiveStock: (purchaseId: string) =>
    fetch(`${API_BASE_URL}/purchases/${purchaseId}/receive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string; purchase: any }>),

  // EXPIRY
  getExpiry: (range?: string) => {
    const url = new URL(`${API_BASE_URL}/expiry`);
    if (range) url.searchParams.set('range', range);
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(
      handleResponse<{ success: boolean; count: number; batches: any[] }>
    );
  },

  disposeBatch: (batchId: string, reason: string) =>
    fetch(`${API_BASE_URL}/expiry/${batchId}/dispose`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }).then(handleResponse<{ success: boolean; message: string; batch: any }>),

  // ALERTS
  getAlerts: () =>
    fetch(`${API_BASE_URL}/alerts`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; count: number; alerts: any[] }>),

  markAlertRead: (id: string) =>
    fetch(`${API_BASE_URL}/alerts/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; alert: any }>),

  markAllAlertsRead: () =>
    fetch(`${API_BASE_URL}/alerts/mark-all/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string }>),

  // STAFF
  getStaff: () =>
    fetch(`${API_BASE_URL}/staff`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; count: number; users: any[] }>),

  createStaff: (data: any) =>
    fetch(`${API_BASE_URL}/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; user: any }>),

  updateStaff: (id: string, updates: any) =>
    fetch(`${API_BASE_URL}/staff/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse<{ success: boolean; user: any }>),

  deleteStaff: (id: string) =>
    fetch(`${API_BASE_URL}/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; message: string }>),

  resetStaffPassword: (id: string, newPassword: string) =>
    fetch(`${API_BASE_URL}/staff/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    }).then(handleResponse<{ success: boolean; message: string }>),

  // REPORTS
  getReports: (period?: string) => {
    const url = new URL(`${API_BASE_URL}/reports`);
    if (period) url.searchParams.set('period', period);
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(
      handleResponse<{ success: boolean; report: any }>
    );
  },

  // SETTINGS
  getSettings: () =>
    fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ success: boolean; settings: any }>),

  updateSettings: (updates: any) =>
    fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse<{ success: boolean; settings: any; message: string }>),
};
