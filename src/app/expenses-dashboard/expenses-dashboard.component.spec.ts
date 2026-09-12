import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ExpensesDashboardComponent } from './expenses-dashboard.component';
import { ExpenseList } from '../types/expenseList';

describe('ExpensesDashboardComponent', () => {
  let component: ExpensesDashboardComponent;
  let fixture: ComponentFixture<ExpensesDashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesDashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Responde à requisição disparada pelo ngOnInit. */
  function flushExpenses(payload: ExpenseList[] = []) {
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.includes('Expense')).flush(payload);
    fixture.detectChanges();
  }

  it('should create', () => {
    flushExpenses();
    expect(component).toBeTruthy();
  });

  it('should build one month per month of the year', () => {
    expect(component.monthList.length).toBe(12);
    expect(component.monthList.every((date) => date.getDate() === 1)).toBeTrue();

    flushExpenses();
  });

  it('should stop loading once the expenses arrive', () => {
    expect(component.isLoading).toBeTrue();

    flushExpenses();

    expect(component.isLoading).toBeFalse();
  });

  it('should return the expense list matching the requested month', () => {
    const march: ExpenseList = {
      userId: 1,
      expensesMonth: 3,
      totalExpenses: 100,
      expenses: [],
    };
    flushExpenses([march]);

    // getExpensesForMonth recebe o mês 0-indexado; expensesMonth é 1-indexado.
    expect(component.getExpensesForMonth(2)).toBe(march);
  });

  it('should return an empty list for a month with no expenses', () => {
    flushExpenses([]);

    const result = component.getExpensesForMonth(5);

    expect(result.expenses).toEqual([]);
    expect(result.totalExpenses).toBe(0);
  });
});
