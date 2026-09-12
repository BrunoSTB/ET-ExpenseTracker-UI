import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ExpensesCardComponent } from './expenses-card.component';
import { Expense } from '../types/expenses';
import { ExpenseList } from '../types/expenseList';

describe('ExpensesCardComponent', () => {
  let component: ExpensesCardComponent;
  let fixture: ComponentFixture<ExpensesCardComponent>;
  let httpMock: HttpTestingController;

  function monthWith(expenses: Expense[]): ExpenseList {
    return { userId: 1, expensesMonth: 3, totalExpenses: 0, expenses };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesCardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should expose the expenses of the month it receives', () => {
    const expenses = [new Expense(1, 'Aluguel', 850, new Date())];
    component.monthExpenses = monthWith(expenses);

    fixture.detectChanges();

    expect(component.expensesList).toEqual(expenses);
  });

  it('should show the month name of the date it receives', () => {
    component.currentDate = new Date(2026, 2, 1);
    fixture.detectChanges();

    expect(component.getCurrentMonth().toLowerCase()).toContain('march');
  });

  describe('getSum', () => {
    it('should be zero for an empty month', () => {
      fixture.detectChanges();
      expect(component.getSum()).toBe(0);
    });

    it('should add up the expense values', () => {
      component.monthExpenses = monthWith([
        new Expense(1, 'Aluguel', 850, new Date()),
        new Expense(2, 'Tim', 42.99, new Date()),
      ]);
      fixture.detectChanges();

      expect(component.getSum()).toBe(892.99);
    });

    it('should round floating point noise to two decimals', () => {
      component.monthExpenses = monthWith([
        new Expense(1, 'A', 0.1, new Date()),
        new Expense(2, 'B', 0.2, new Date()),
      ]);
      fixture.detectChanges();

      expect(component.getSum()).toBe(0.3);
    });
  });

  describe('getItemWithHighestId', () => {
    it('should return 0 for an empty list', () => {
      fixture.detectChanges();
      expect(component.getItemWithHighestId()).toBe(0);
    });

    it('should return the highest id in the list', () => {
      component.monthExpenses = monthWith([
        new Expense(3, 'A', 1, new Date()),
        new Expense(7, 'B', 1, new Date()),
        new Expense(5, 'C', 1, new Date()),
      ]);
      fixture.detectChanges();

      expect(component.getItemWithHighestId()).toBe(7);
    });
  });

  describe('handleFormSubmit', () => {
    beforeEach(() => fixture.detectChanges());

    it('should append the submitted expense and close the form', () => {
      component.showForm = true;
      const expense = new Expense(9, 'Internet', 99.99, new Date());

      component.handleFormSubmit(expense);

      expect(component.expensesList).toContain(expense);
      expect(component.biggestId).toBe(9);
      expect(component.showForm).toBeFalse();
    });

    it('should ignore an expense with an empty name', () => {
      const expense = new Expense(9, '', 99.99, new Date());

      component.handleFormSubmit(expense);

      expect(component.expensesList).toEqual([]);
    });
  });

  it('should toggle the form visibility', () => {
    fixture.detectChanges();
    expect(component.showForm).toBeFalse();

    component.toggleForm();

    expect(component.showForm).toBeTrue();
  });
});
