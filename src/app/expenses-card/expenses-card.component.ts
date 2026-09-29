import { Component, Input, OnInit } from '@angular/core';
import { Expense } from '../types/expenses'
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExpenseList } from '../types/expenseList';
import { ExpenseService } from '../services/expense.service';

@Component({
  selector: 'app-expenses-card',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, ExpenseFormComponent],
  templateUrl: './expenses-card.component.html',
  styleUrl: './expenses-card.component.css'
})

export class ExpensesCardComponent implements OnInit {
  @Input() currentDate: Date = new Date();
  @Input() monthExpenses: ExpenseList = {expenses: [], expensesMonth: this.currentDate.getMonth(), totalExpenses:0, userId: 0};
  expensesList: Expense[] = [];

  constructor(private expenseService: ExpenseService) { }

  ngOnInit(): void {
      this.expensesList = this.monthExpenses.expenses;
  }

  showForm: boolean = false;
  confirmingClear: boolean = false;
  errorMessage: string | null = null;

  handleFormSubmit(formData: Expense) {
    if(formData.name.length > 0)
    {
      this.expensesList.push(formData);
    }
    this.toggleForm();
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  getCurrentMonth(){
    return this.currentDate.toLocaleString('default', { month: 'long' });
  }

  clearExpenseList() {
    this.confirmingClear = false;
    const previous = this.expensesList;
    let ids = previous.map(x => x.id);
    this.expensesList = [];
    this.errorMessage = null;

    this.expenseService.deleteByIds(ids)
      .subscribe({
        error: () => {
          this.expensesList = previous;
          this.errorMessage = 'Could not clear the expenses.';
        }
      });
  }

  removeExpense(expenseId: number) {
    const previous = this.expensesList;
    this.expensesList = previous.filter(x => x.id !== expenseId);
    this.errorMessage = null;

    this.expenseService.deleteByIds([expenseId])
      .subscribe({
        error: () => {
          this.expensesList = previous;
          this.errorMessage = 'Could not remove the expense.';
        }
      });
  }

  getSum() {
    let sum: number = 0;
    this.expensesList.forEach(a => sum += a.value);
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }
}
