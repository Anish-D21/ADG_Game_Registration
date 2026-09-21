/**
 * @file api.ts
 * @description Frontend HTTP Client for DECEPTION Backend APIs
 */

const API_BASE = '/api';

export function getAdminAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('deception_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchGameInfo() {
  const res = await fetch(`${API_BASE}/games/deception`);
  return res.json();
}

export async function createRegistration(data: any) {
  const res = await fetch(`${API_BASE}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to submit registration');
  }
  return json;
}

export async function fetchRegistration(id: string) {
  const res = await fetch(`${API_BASE}/registrations/${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Registration not found');
  }
  return json;
}

export async function createPaymentOrder(data: any) {
  const res = await fetch(`${API_BASE}/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchPaymentStatus(registrationId: string) {
  const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(registrationId)}`);
  return res.json();
}

export async function submitManualUpi(registrationId: string, data: { transactionReference: string; amount: number; payerName?: string; evidenceUrl?: string }) {
  const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(registrationId)}/manual-upi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to submit manual UPI payment');
  }
  return json;
}

export async function simulateMockPayment(registrationId: string) {
  const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(registrationId)}/mock-pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function uploadDocument(data: { fileName: string; fileType: string; dataUrl: string; ownerName?: string }) {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// ---------------- Admin APIs ----------------

export async function adminLogin(credentials: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Admin login failed');
  }
  if (json.token) {
    localStorage.setItem('deception_admin_token', json.token);
    localStorage.setItem('deception_admin_user', JSON.stringify(json.admin));
  }
  return json;
}

export async function fetchAdminDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: { ...getAdminAuthHeader() }
  });
  if (!res.ok) throw new Error('Unauthorized or failed to load dashboard stats');
  return res.json();
}

export async function fetchAdminRegistrations(filters: { search?: string; status?: string; teamSize?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.teamSize) params.append('teamSize', filters.teamSize);

  const res = await fetch(`${API_BASE}/admin/registrations?${params.toString()}`, {
    headers: { ...getAdminAuthHeader() }
  });
  return res.json();
}

export async function fetchAdminStudents(filters: { search?: string; branch?: string; year?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.branch) params.append('branch', filters.branch);
  if (filters.year) params.append('year', filters.year);

  const res = await fetch(`${API_BASE}/admin/students?${params.toString()}`, {
    headers: { ...getAdminAuthHeader() }
  });
  return res.json();
}

export async function fetchAdminTeams() {
  const res = await fetch(`${API_BASE}/admin/teams`, {
    headers: { ...getAdminAuthHeader() }
  });
  return res.json();
}

export async function fetchAdminPayments() {
  const res = await fetch(`${API_BASE}/admin/payments`, {
    headers: { ...getAdminAuthHeader() }
  });
  return res.json();
}

export async function verifyAdminPayment(paymentId: string) {
  const res = await fetch(`${API_BASE}/admin/payments/${encodeURIComponent(paymentId)}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeader()
    }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Verification failed');
  return json;
}

export async function rejectAdminPayment(paymentId: string, reason: string) {
  const res = await fetch(`${API_BASE}/admin/payments/${encodeURIComponent(paymentId)}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeader()
    },
    body: JSON.stringify({ reason })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Rejection failed');
  return json;
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: { ...getAdminAuthHeader() }
  });
  return res.json();
}

export async function fetchEmailLogs() {
  const res = await fetch(`${API_BASE}/admin/email-logs`, {
    headers: { ...getAdminAuthHeader() }
  });
  return res.json();
}
