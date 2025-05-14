import { Component } from '@angular/core';
import { ExpensesCardComponent } from '../expenses-card/expenses-card.component';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-expenses-dashboard',
  standalone: true,
  imports: [ExpensesCardComponent, NgFor],
  templateUrl: './expenses-dashboard.component.html',
  styleUrl: './expenses-dashboard.component.css'
})
export class ExpensesDashboardComponent {
  monthList = this.getFirstDayOfEachMonth();
  
  getFirstDayOfEachMonth(): Date[] {
    const currentYear = new Date().getFullYear();
    const months = [];
  
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(currentYear, month, 1);
      months.push(firstDay);
    }
  
    return months;
  }
}
