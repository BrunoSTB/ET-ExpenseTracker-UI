import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Expense } from "../types/expenses";
import { ExpenseList } from "../types/expenseList";

@Injectable({
  providedIn: "root",
})
export class ExpenseService {
  constructor(private http: HttpClient) {}

  list(year: number) {
    return this.http.get<ExpenseList[]>(
      environment.apiUri + `Expense?year=${year}`
    );
  }

  create(expense: Expense) {
    return this.http.post(environment.apiUri + "Expense", expense);
  }

  deleteByIds(ids: number[]) {
    let params = new HttpParams();
    ids.forEach((id) => {
      params = params.append("ids", id.toString());
    });

    return this.http.delete(environment.apiUri + "Expense/DeleteByIds", {
      params,
    });
  }
}
