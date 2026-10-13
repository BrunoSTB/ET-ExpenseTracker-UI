import { Bill } from "./bill";

export interface BillMonth {
  // 1-based month (1 = January).
  month: number;
  bills: Bill[];
}
