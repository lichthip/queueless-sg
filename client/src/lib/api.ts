import type { Center, AuthResponse, PredictionResult } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function req<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  centers: {
    list:    ()           => req<Center[]>('/api/centers'),
    get:     (id: number) => req<Center>(`/api/centers/${id}`),
    predict: (id: number) => req<PredictionResult>(`/api/centers/${id}/predict`),
  },
  queues: {
    adjust: (centerId: number, delta: number, token: string) =>
      req<QueueUpdateEvent>(`/api/queues/${centerId}/adjust`, {
        method: 'PATCH', body: JSON.stringify({ delta }),
      }, token),
    setStatus: (centerId: number, isOpen: boolean, token: string) =>
      req<{ success: boolean }>(`/api/queues/${centerId}/status`, {
        method: 'PATCH', body: JSON.stringify({ isOpen }),
      }, token),
    history: (centerId: number, hours = 24) =>
      req<{ count: number; recorded_at: string }[]>(
        `/api/queues/${centerId}/history?hours=${hours}`
      ),
  },
  auth: {
    login: (username: string, password: string) =>
      req<AuthResponse>('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ username, password }),
      }),
  },
};

import type { QueueUpdateEvent } from '@/types';