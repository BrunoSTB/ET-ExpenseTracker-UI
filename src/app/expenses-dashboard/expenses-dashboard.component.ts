import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ExpensesCardComponent } from '../expenses-card/expenses-card.component';
import { ExpenseList } from '../types/expenseList';
import { ExpenseService } from '../services/expense.service';

@Component({
  selector: 'app-expenses-dashboard',
  standalone: true,
  imports: [ExpensesCardComponent],
  templateUrl: './expenses-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './expenses-dashboard.component.css'
})
export class ExpensesDashboardComponent implements OnInit {
  year = new Date().getFullYear();
  monthList = this.getFirstDayOfEachMonth();
  yearlyExpenses: ExpenseList[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.getExpenses();
  }

  getFirstDayOfEachMonth(): Date[] {
    const months = [];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(this.year, month, 1);
      months.push(firstDay);
    }

    return months;
  }

  getExpenses() {
    this.expenseService.list(this.year)
      .subscribe({
        next: (response) => {
          this.yearlyExpenses = response;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Could not load your expenses. Please try again later.';
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
