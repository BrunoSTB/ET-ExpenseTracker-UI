import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Expense } from '../types/expenses';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionService } from '../services/session.service';

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

  constructor(private http: HttpClient, private sessionService: SessionService) { }

  formData = {
    name: '',
    value: 0
  };

  createNewExpense(){
    let result = new Expense(++this.biggestId,
                             this.formData.name, 
                             this.formData.value, 
                             this.currentDate);
    
    const headers = new HttpHeaders({
      'Authorization': `${this.sessionService.getToken()}`,
    });
    this.http.post('https://localhost:7010/Expense', result, { headers })
      .subscribe({
        next: () => {this.formSubmit.emit(result);},
        error: (err) => {
          console.error('Error fetching data:', err);
        }
      });
  }
}
