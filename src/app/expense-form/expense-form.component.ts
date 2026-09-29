import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Expense, NewExpense } from '../types/expenses';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../services/expense.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css'
})

export class ExpenseFormComponent {
  @Input() currentDate: Date = new Date();
  @Output() formSubmit = new EventEmitter<Expense>();

  constructor(private expenseService: ExpenseService) { }

  formData = {
    name: '',
    value: 0
  };

  createNewExpense(){
    const newExpense: NewExpense = {
      name: this.formData.name,
      value: this.formData.value,
      expenseDate: this.currentDate
    };

    this.expenseService.create(newExpense)
      .subscribe({
        next: (created) => {this.formSubmit.emit(created);},
        error: (err) => {
          console.error('Error fetching data:', err);
        }
      });
  }
}
