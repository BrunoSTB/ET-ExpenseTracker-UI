import { AmountType } from "./amountType";

export interface RecurringBill {
  id: number;
  name: string;
  // 1-31; months without that day use their last day.
  dueDay: number;
  amountType: AmountType;
  // Required for Fixed, null for the variable types.
  fixedValue: number | null;
  // First day of the month, ISO `yyyy-MM-dd`.
  startMonth: string;
  endMonth: string | null;
}

export interface RecurringBillRequest {
  name: string;
  dueDay: number;
  amountType: AmountType;
  fixedValue?: number | null;
}

export interface NewRecurringBill extends RecurringBillRequest {
  // Defaults to the current month on the server.
  startMonth?: string;
}
