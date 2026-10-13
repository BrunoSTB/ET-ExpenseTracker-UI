import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Bill, NewBill } from "../types/bill";
import { BillMonth } from "../types/billMonth";

@Injectable({
  providedIn: "root",
})
export class BillService {
  constructor(private http: HttpClient) {}

  // Also generates any missing bills of the year on the server.
  getYear(year: number) {
    return this.http.get<BillMonth[]>(environment.apiUri + `Bill?year=${year}`);
  }

  create(bill: NewBill) {
    return this.http.post<Bill>(environment.apiUri + "Bill", bill);
  }

  pay(id: number, value?: number | null) {
    return this.http.put<Bill>(environment.apiUri + `Bill/${id}/Payment`, {
      value: value ?? null,
    });
  }

  undoPayment(id: number) {
    return this.http.delete<Bill>(environment.apiUri + `Bill/${id}/Payment`);
  }

  // Only one-off bills can be deleted; the API answers 409 for recurring ones.
  delete(id: number) {
    return this.http.delete<void>(environment.apiUri + `Bill/${id}`);
  }
}
