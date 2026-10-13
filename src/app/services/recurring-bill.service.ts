import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import {
  NewRecurringBill,
  RecurringBill,
  RecurringBillRequest,
} from "../types/recurringBill";

@Injectable({
  providedIn: "root",
})
export class RecurringBillService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<RecurringBill[]>(environment.apiUri + "RecurringBill");
  }

  create(recurringBill: NewRecurringBill) {
    return this.http.post<RecurringBill>(
      environment.apiUri + "RecurringBill",
      recurringBill
    );
  }

  // Applies from the current month on; paid bills and past months keep their values.
  update(id: number, recurringBill: RecurringBillRequest) {
    return this.http.put<RecurringBill>(
      environment.apiUri + `RecurringBill/${id}`,
      recurringBill
    );
  }

  // Soft delete: ends the recurrence this month and removes its unpaid bills.
  delete(id: number) {
    return this.http.delete<void>(environment.apiUri + `RecurringBill/${id}`);
  }
}
