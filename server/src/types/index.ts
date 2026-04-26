export type CenterType = 'polyclinic' | 'ICA' | 'HDB' | 'CDC' | 'CPF';

export interface Center {
  id: number;
  name: string;
  type: CenterType;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  operating_hours: string;
}

export interface QueueState {
  id: number;
  center_id: number;
  current_count: number;
  serving_number: number;
  avg_service_minutes: number;
  is_open: number;
  updated_at: string;
}

export interface StaffUser {
  id: number;
  username: string;
  password_hash: string;
  center_id: number | null;
  role: 'staff' | 'admin';
}

export interface JWTPayload {
  userId: number;
  username: string;
  centerId: number | null;
  role: string;
}

export interface QueueUpdateEvent {
  centerId: number;
  currentCount: number;
  servingNumber: number;
  estimatedWaitMinutes: number;
  isOpen: boolean;
  updatedAt: string;
}