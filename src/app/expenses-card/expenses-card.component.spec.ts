import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ExpensesCardComponent } from './expenses-card.component';
import { Expense } from '../types/expenses';
import { ExpenseList } from '../types/expenseList';
import { environment } from '../../environments/environment';

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

  describe('getCurrentMonth', () => {
    // getCurrentMonth() usa toLocaleString('default'), que resolve pelo locale
    // do browser: 'March' num runner en-US, 'março' num Windows pt-BR. Cravar a
    // string quebraria na máquina de quem roda com outro locale, então as
    // asserções comparam com a formatação equivalente.
    function monthNameOf(date: Date): string {
      return date.toLocaleString('default', { month: 'long' });
    }

    it('should render the month of the date it receives', () => {
      const march = new Date(2026, 2, 1);
      component.currentDate = march;
      fixture.detectChanges();

      expect(component.getCurrentMonth()).toBe(monthNameOf(march));
    });

    it('should follow the date it receives instead of today', () => {
      // Seis meses de distância garante um mês diferente do atual em qualquer
      // época do ano.
      const today = new Date();
      const otherMonth = new Date(today.getFullYear(), (today.getMonth() + 6) % 12, 1);
      component.currentDate = otherMonth;
      fixture.detectChanges();

      expect(component.getCurrentMonth()).toBe(monthNameOf(otherMonth));
      expect(component.getCurrentMonth()).not.toBe(monthNameOf(today));
    });
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

  describe('removeExpense', () => {
    beforeEach(() => {
      component.monthExpenses = monthWith([
        new Expense(1, 'Aluguel', 850, new Date()),
        new Expense(2, 'Tim', 42.99, new Date()),
      ]);
      fixture.detectChanges();
    });

    it('should drop the expense from the list', () => {
      component.removeExpense(1);

      expect(component.expensesList.map((e) => e.id)).toEqual([2]);
      httpMock.expectOne((req) => req.url.includes('DeleteByIds')).flush({});
    });

    // Regressão #5: a URL estava fixa em https://localhost:7010, então o
    // delete individual nunca chegava na API publicada.
    it('should call the configured API, not a hardcoded localhost', () => {
      component.removeExpense(1);

      const req = httpMock.expectOne(
        (r) => r.url === environment.apiUri + 'Expense/DeleteByIds'
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    // Regressão #5: o id era enviado duas vezes (.set seguido de .append).
    it('should send the id exactly once', () => {
      component.removeExpense(1);

      const req = httpMock.expectOne((r) => r.url.includes('DeleteByIds'));
      expect(req.request.params.getAll('ids')).toEqual(['1']);
      req.flush({});
    });
  });
});
