import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ExpensesDashboardComponent } from './expenses-dashboard.component';
import { ExpenseList } from '../types/expenseList';
import { environment } from '../../environments/environment';

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

  function flushExpenses(payload: ExpenseList[] = []) {
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.includes('Expense')).flush(payload);
    fixture.detectChanges();
  }

  it('should create', () => {
    flushExpenses();
    expect(component).toBeTruthy();
  });

  it('should query the same year it renders', () => {
    const currentYear = new Date().getFullYear();
    fixture.detectChanges();

    const req = httpMock.expectOne(
      environment.apiUri + `Expense?year=${currentYear}`
    );
    req.flush([]);

    expect(component.monthList[0].getFullYear()).toBe(currentYear);
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

  it('should stop loading and show an error when the API fails', () => {
    fixture.detectChanges();
    httpMock
      .expectOne((req) => req.url.includes('Expense'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.error-message')).not.toBeNull();
  });

  it('should return the expense list matching the requested month', () => {
    const march: ExpenseList = {
      userId: 1,
      expensesMonth: 3,
      totalExpenses: 100,
      expenses: [],
    };
    flushExpenses([march]);

    expect(component.getExpensesForMonth(2)).toBe(march);
  });

  it('should return an empty list for a month with no expenses', () => {
    flushExpenses([]);

    const result = component.getExpensesForMonth(5);

    expect(result.expenses).toEqual([]);
    expect(result.totalExpenses).toBe(0);
  });
});
