import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Expense } from '../types/expenses';
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
  @Input() biggestId: number = 0;
  @Input() currentDate: Date = new Date();
  @Output() formSubmit = new EventEmitter<Expense>();

  constructor(private expenseService: ExpenseService) { }

  formData = {
    name: '',
    value: 0
  };

  createNewExpense(){
    let result = new Expense(++this.biggestId,
                             this.formData.name,
                             this.formData.value,
                             this.currentDate);

    this.expenseService.create(result)
      .subscribe({
        next: () => {this.formSubmit.emit(result);},
        error: (err) => {
          console.error('Error fetching data:', err);
        }
      });
  }
}
