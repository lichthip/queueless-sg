export type CenterType = 'polyclinic' | 'ICA' | 'HDB' | 'CDC' | 'CPF';
export type LoadLevel   = 'low' | 'moderate' | 'high' | 'closed';

export interface QueueState {
  id: number;
  center_id: number;
  current_count: number;
  serving_number: number;
  avg_service_minutes: number;
  is_open: number;
  updated_at: string;
  estimatedWaitMinutes: number;
}

export interface Center {
  id: number;
  name: string;
  type: CenterType;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  operating_hours: string;
  queue: QueueState;
}

export interface QueueUpdateEvent {
  centerId: number;
  currentCount: number;
  servingNumber: number;
  estimatedWaitMinutes: number;
  isOpen: boolean;
  updatedAt: string;
}

export interface BestTimeWindow {
  hour: number;
  label: string;
  expectedWaitMinutes: number;
  relativeLoad: string;
}

export interface PredictionResult {
  centerId: number;
  currentHourForecast: number;
  bestWindows: BestTimeWindow[];
  historicalAverage: number | null;
}

export interface StaffUser {
  id: number;
  username: string;
  centerId: number | null;
  role: 'staff' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: StaffUser;
}