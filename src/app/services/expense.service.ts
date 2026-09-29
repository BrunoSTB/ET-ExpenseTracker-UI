import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Expense, NewExpense } from "../types/expenses";
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

  create(expense: NewExpense) {
    // TODO: update server API to match expenseDate property name
    return this.http.post<Expense>(environment.apiUri + "Expense", {
      name: expense.name,
      value: expense.value,
      date: expense.expenseDate,
    });
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
