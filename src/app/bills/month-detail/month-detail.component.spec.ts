import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MonthDetailComponent } from './month-detail.component';
import { Bill } from '../../types/bill';
import { getTranslocoModule } from '../../../testing/transloco-testing';

// Intl separates the currency symbol with a non-breaking space.
const NBSP = '\u00a0';
const TODAY = new Date(2026, 9, 8);

function bill(id: number, overrides: Partial<Bill> = {}): Bill {
  return {
    id,
    recurringBillId: null,
    name: `Bill ${id}`,
    dueDate: '2026-10-20',
    amountType: 'Fixed',
    value: 100,
    estimate: null,
    paidAt: null,
    canDelete: true,
    ...overrides,
  };
}

describe('MonthDetailComponent', () => {
  let component: MonthDetailComponent;
  let fixture: ComponentFixture<MonthDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthDetailComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthDetailComponent);
    component = fixture.componentInstance;
  });

  function render(bills: Bill[]) {
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 10);
    fixture.componentRef.setInput('bills', bills);
    fixture.componentRef.setInput('today', TODAY);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(element: HTMLElement, selector: string) {
    return element.querySelector(selector)?.textContent?.replace(/[ \t\r\n]+/g, ' ').trim();
  }

  const monthBills = () => [
    bill(1, { name: 'Aluguel', dueDate: '2026-10-05', value: 1500, paidAt: '2026-10-04' }),
    bill(2, { name: 'Internet', dueDate: '2026-10-05', value: 100 }),
    bill(3, { name: 'Luz', dueDate: '2026-10-10', amountType: 'VariableEstimated', value: null, estimate: 127.5 }),
    bill(4, { name: 'Água', dueDate: '2026-10-02', amountType: 'VariableOnArrival', value: null }),
  ];

  it('should render the month title', () => {
    const element = render([]);

    expect(text(element, '.month-title')).toBe('outubro de 2026');
  });

  it('should render an empty state without bills', () => {
    const element = render([]);

    expect(text(element, '.empty')).toBe('Nenhuma conta neste mês.');
    expect(element.querySelector('.totals')).toBeNull();
  });

  it('should render how many bills were paid', () => {
    const element = render(monthBills());

    expect(text(element, '.paid-count')).toBe('1 de 4 contas pagas');
  });

  it('should size the progress bar by paid and overdue bills', () => {
    const element = render(monthBills());
    const segments = element.querySelectorAll<HTMLElement>('.progress-segment');

    expect(segments[0].style.width).toBe('25%');
    expect(segments[1].style.width).toBe('50%');
  });

  it('should render the totals', () => {
    const element = render(monthBills());

    expect(text(element, '.total-paid')).toBe(`R$${NBSP}1.500,00`);
    expect(text(element, '.total-left')).toBe(`R$${NBSP}227,50`);
    expect(text(element, '.total-overdue')).toBe(`R$${NBSP}100,00`);
    expect(text(element, '.total-month')).toBe(`R$${NBSP}1.727,50`);
  });

  it('should split the bills into to pay and paid, by due date', () => {
    const element = render(monthBills());

    const names = (selector: string) =>
      Array.from(element.querySelectorAll(`${selector} .bill-name`)).map((name) =>
        name.textContent?.replace(/[ \t\r\n]+/g, ' ').trim()
      );
    expect(names('app-bill-row.to-pay')).toEqual(['Água Variável', 'Internet', 'Luz Variável']);
    expect(names('app-bill-row.paid')).toEqual(['Aluguel']);
  });

  it('should say when nothing is left to pay', () => {
    const element = render([bill(1, { paidAt: '2026-10-01' })]);

    expect(text(element, '.empty')).toBe('Nada a pagar.');
  });

  it('should emit previous and next', () => {
    const element = render([]);
    const events: string[] = [];
    component.previous.subscribe(() => events.push('previous'));
    component.next.subscribe(() => events.push('next'));

    element.querySelector<HTMLButtonElement>('.nav-button.previous')!.click();
    element.querySelector<HTMLButtonElement>('.nav-button.next')!.click();

    expect(events).toEqual(['previous', 'next']);
    expect(element.querySelector('.nav-button.previous')?.getAttribute('aria-label')).toBe('Mês anterior');
  });

  it('should offer to add a bill, even in an empty month', () => {
    let added = 0;
    component.addBill.subscribe(() => added++);
    const element = render([]);

    expect(text(element, '.month-footer .add-bill')).toBe('+ Adicionar conta');
    element.querySelector<HTMLElement>('.add-bill')!.click();

    expect(added).toBe(1);
  });

  it('should forward the bills removed in a row', () => {
    const removed: Bill[] = [];
    component.billRemoved.subscribe((value) => removed.push(value));
    const value = bill(1);
    render([value]);

    const row = fixture.debugElement.query((debug) => debug.name === 'app-bill-row');
    row.componentInstance.removed.emit(value);

    expect(removed).toEqual([value]);
  });

  it('should relay the payment actions of the rows with the bill', () => {
    const element = render(monthBills());
    const paid: { id: number; value: number | null }[] = [];
    const undone: number[] = [];
    component.pay.subscribe(({ bill, value }) => paid.push({ id: bill.id, value }));
    component.undoPayment.subscribe((bill) => undone.push(bill.id));

    element.querySelector<HTMLButtonElement>('app-bill-row.to-pay:nth-of-type(2) .pay-toggle')!.click();
    element.querySelector<HTMLButtonElement>('app-bill-row.paid .pay-toggle')!.click();

    expect(paid).toEqual([{ id: 2, value: null }]);
    expect(undone).toEqual([1]);
  });
});
