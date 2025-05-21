import { Component, OnInit } from '@angular/core';
import { ExpensesCardComponent } from '../expenses-card/expenses-card.component';
import { NgFor, NgIf } from '@angular/common';
import { ExpenseList } from '../types/expenseList';
import { SessionService } from '../services/session.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-expenses-dashboard',
  standalone: true,
  imports: [ExpensesCardComponent, NgFor, NgIf],
  templateUrl: './expenses-dashboard.component.html',
  styleUrl: './expenses-dashboard.component.css'
})
export class ExpensesDashboardComponent implements OnInit {
  monthList = this.getFirstDayOfEachMonth();
  yearlyExpenses: ExpenseList[] = [];
  isLoading: boolean = true;
  
  constructor(private sessionService: SessionService,
              private http: HttpClient) {}
  
  ngOnInit(): void {
    this.getExpenses();
  } 

  getFirstDayOfEachMonth(): Date[] {
    const currentYear = new Date().getFullYear();
    const months = [];
  
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(currentYear, month, 1);
      months.push(firstDay);
    }
  
    return months;
  }

  getExpenses() {
    const headers = new HttpHeaders({
      'Authorization': `${this.sessionService.getToken()}`,
    });
    this.http.get<ExpenseList[]>(environment.apiUri + 'Expense?year=2025', { headers })
      .subscribe({
        next: (response) => { 
          this.yearlyExpenses = response; 
          this.isLoading = false;
        },
      });
  }

  getExpensesForMonth(month: number): ExpenseList {
    const expenses = this.yearlyExpenses.filter(expenseList => expenseList.expensesMonth === month + 1);
    
    if(expenses === undefined || expenses.length === 0)
        return {expenses: [], expensesMonth: month, totalExpenses:0 , userId:0}

    return expenses[0];
  }
}
