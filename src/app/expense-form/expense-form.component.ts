import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Expense } from '../types/expenses';
import { FormsModule } from '@angular/forms';

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
  
  formData = {
    name: '',
    value: 0
  };

  createNewExpense(){
    this.formSubmit.emit(
      new Expense(
        ++this.biggestId,
        this.formData.name, 
        this.formData.value, 
        this.currentDate
      )
    );
  }
}
