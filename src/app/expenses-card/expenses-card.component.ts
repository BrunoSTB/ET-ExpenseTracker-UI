import { Component, Input, OnInit } from '@angular/core';
import { Expense } from '../types/expenses'
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExpenseList } from '../types/expenseList';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { SessionService } from '../services/session.service';
import { environment } from '../../environments/environment';

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
  
  constructor(private http: HttpClient, private sessionService: SessionService) { }
  
  ngOnInit(): void {
      this.expensesList = this.monthExpenses.expenses;
  }

  
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
      let ids = this.expensesList.map(x => x.id);
      this.expensesList = [];

      const headers = new HttpHeaders({
        'Authorization': `${this.sessionService.getToken()}`,
      });

      let params = new HttpParams();
      ids.forEach(id => {
        params = params.append('ids', id.toString());
      });

      this.http.delete(environment.apiUri + 'Expense/DeleteByIds', { headers, params })
      .subscribe({
        next: () => {console.log("Deleted sucessfully");},
        error: (err) => {
          console.error('Error fetching data:', err);
        }
      });
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
    
    const headers = new HttpHeaders({
        'Authorization': `${this.sessionService.getToken()}`,
      });

    let params = new HttpParams().set('ids', expenseId);
    params = params.append('ids', expenseId.toString());

    this.http.delete('https://localhost:7010/Expense/DeleteByIds', { headers, params })
    .subscribe({
      next: () => {console.log("Deleted sucessfully");},
      error: (err) => {
        console.error('Error fetching data:', err);
      }
    });
  }

  getSum() {
    let sum: number = 0;
    this.expensesList.forEach(a => sum += a.value);
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }
}
