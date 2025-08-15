import { Billboard } from "./billboard";

export interface BookingDates {
  startDate: Date;
  endDate: Date;
}

export interface SelectedBillboard {
  billboard: Billboard;
  quantity: number;
  totalPrice: number;
}

export interface BookingCart {
  items: SelectedBillboard[];
  totalCost: number;
  totalBillboards: number;
}

export interface BookingRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  company?: string;
  dates: BookingDates;
  selectedBillboards: SelectedBillboard[];
  totalCost: number;
  message?: string;
}

export type BookingStatus = "pending" | "approved" | "rejected" | "confirmed";

export interface Booking extends BookingRequest {
  id: string;
  status: BookingStatus;
  createdAt: string;
  responseDate?: string;
  ownerResponse?: string;
}