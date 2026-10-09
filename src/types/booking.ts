export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "CARD";
export type SlotState = "available" | "booked" | "blocked";
export type SlotPeriod = "DAY" | "EVENING" | "NIGHT";

export interface Pitch {
  id: string;
  slug: string;
  name: string;
  sport: string;
  dimensions: string;
  ratePerSlot: number;
  imageUrl: string | null;
  description: string | null;
  order: number;
  active: boolean;
}

export interface Booking {
  id: string;
  code: string;
  pitchId: string;
  pitch?: Pitch;
  pitchName?: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  nid: string;
  teamName: string | null;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  amount: number;
  notes: string | null;
  manual: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  period: SlotPeriod;
  state: SlotState;
  price: number;
  reason?: string | null;
}

export interface PeriodGroup {
  key: SlotPeriod;
  label: string;
  hint: string;
  slots: TimeSlot[];
}

export interface AvailabilityResponse {
  date: string;
  opening: string;
  closing: string;
  pitch: Pitch;
  pitches: Pitch[];
  slots: TimeSlot[];
  periods: PeriodGroup[];
}

export interface SlotOverride {
  id: string;
  pitchId: string;
  pitch?: Pitch;
  date: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  reason: string | null;
  rateOverride: number | null;
}

export interface BookingPayload {
  pitchId: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  nid: string;
  teamName?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  manual?: boolean;
}

export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
