import { Component, Input } from '@angular/core';
import { Expense, expenses } from '../types/expenses'
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';

@Component({
  selector: 'app-expenses-card',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, ExpenseFormComponent],
  templateUrl: './expenses-card.component.html',
  styleUrl: './expenses-card.component.css'
})

export class ExpensesCardComponent {
  @Input() currentDate: Date = new Date();
  expensesList = [...expenses];
  biggestId = this.getItemWithHighestId(); 
  showForm: boolean = false;

  handleFormSubmit(formData: Expense) {
    if(formData.name.length > 0)
    {
      this.biggestId = formData.id;
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
    if (confirm("Do you really want to clear all of your expenses?")){
      this.expensesList = [];
    }
  }

  getItemWithHighestId(): number {
    if (this.expensesList.length === 0) {
      return 0;
    }
    return this.expensesList
      .reduce((prev, current) => (prev.id > current.id) ? prev : current).id;
  }

  removeExpense(expenseId: number) {
    this.expensesList = this.expensesList.filter(x => x.id !== expenseId);
  }

  getSum() {
    let sum: number = 0;
    this.expensesList.forEach(a => sum += a.value);
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }
}
