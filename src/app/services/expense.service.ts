import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "../../environments/environment";
import { Expense, NewExpense } from "../types/expenses";
import { ExpenseList } from "../types/expenseList";

// Formato devolvido pelo POST /Expense: o id é o gerado pelo banco e a data
// vem como expenseDate.
interface CreatedExpenseResponse {
  id: number;
  name: string;
  value: number;
  expenseDate: string;
}

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

  create(expense: NewExpense): Observable<Expense> {
    return this.http
      .post<CreatedExpenseResponse>(environment.apiUri + "Expense", expense)
      .pipe(
        map(
          (created) =>
            new Expense(
              created.id,
              created.name,
              created.value,
              new Date(created.expenseDate)
            )
        )
      );
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
