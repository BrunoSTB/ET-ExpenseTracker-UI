import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { BillRowComponent } from './bill-row.component';
import { Bill } from '../../types/bill';
import { environment } from '../../../environments/environment';
import { getTranslocoModule } from '../../../testing/transloco-testing';

// Intl separates the currency symbol with a non-breaking space.
const NBSP = '\u00a0';
const TODAY = new Date(2026, 9, 8);

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 1,
    recurringBillId: 3,
    name: 'Aluguel',
    dueDate: '2026-10-20',
    amountType: 'Fixed',
    value: 1500,
    estimate: null,
    paidAt: null,
    ...overrides,
  };
}

describe('BillRowComponent', () => {
  let fixture: ComponentFixture<BillRowComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillRowComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BillRowComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function render(value: Bill) {
    fixture.componentRef.setInput('bill', value);
    fixture.componentRef.setInput('today', TODAY);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(element: HTMLElement, selector: string) {
    return element.querySelector(selector)?.textContent?.replace(/[ \t\r\n]+/g, ' ').trim();
  }

  it('should render an overdue bill with the days late', () => {
    const element = render(bill({ dueDate: '2026-10-05' }));

    expect(element.querySelector('.status-dot')?.classList).toContain('status-overdue');
    expect(text(element, '.bill-due')).toBe('Atrasada · Vence 5 de out. · 3 dias de atraso');
  });

  it('should render a bill due soon with the days left', () => {
    const element = render(bill({ dueDate: '2026-10-10' }));

    expect(element.querySelector('.status-dot')?.classList).toContain('status-dueSoon');
    expect(text(element, '.bill-due')).toBe('Vence em breve · Vence 10 de out. · em 2 dias');
  });

  it('should render a pending bill with only the due date', () => {
    const element = render(bill());

    expect(element.querySelector('.status-dot')?.classList).toContain('status-pending');
    expect(text(element, '.bill-due')).toBe('Pendente · Vence 20 de out.');
  });

  it('should render a paid bill with the payment date', () => {
    const element = render(bill({ dueDate: '2026-10-05', paidAt: '2026-10-04' }));

    expect(element.querySelector('.status-dot')?.classList).toContain('status-paid');
    expect(text(element, '.bill-due')).toBe('Paga 4 de out.');
  });

  it('should render an upcoming bill', () => {
    const element = render(bill({ dueDate: '2026-11-20' }));

    expect(element.querySelector('.status-dot')?.classList).toContain('status-upcoming');
    expect(text(element, '.bill-due')).toBe('Próxima · Vence 20 de nov.');
  });

  it('should render the name and value of a fixed bill without the variable tag', () => {
    const element = render(bill());

    expect(text(element, '.bill-name')).toBe('Aluguel');
    expect(element.querySelector('.tag')).toBeNull();
    expect(text(element, '.bill-amount')).toBe(`R$${NBSP}1.500,00`);
  });

  it('should render the estimate with a tilde and the variable tag', () => {
    const element = render(
      bill({ amountType: 'VariableEstimated', value: null, estimate: 127.43 })
    );

    expect(text(element, '.tag')).toBe('Variável');
    expect(text(element, '.bill-amount')).toBe(`~R$${NBSP}127,43`);
  });

  it('should render a dash without value nor estimate', () => {
    const element = render(bill({ amountType: 'VariableOnArrival', value: null }));

    expect(text(element, '.bill-amount')).toBe(`R$${NBSP}—`);
  });

  it('should update when the bill changes', () => {
    render(bill());
    const element = render(bill({ paidAt: '2026-10-08' }));

    expect(element.querySelector('.status-dot')?.classList).toContain('status-paid');
  });

  describe('removing', () => {
    function click(element: HTMLElement, selector: string) {
      element.querySelector<HTMLElement>(selector)!.click();
      fixture.detectChanges();
    }

    it('should not offer to remove bills of a recurring bill', () => {
      const element = render(bill());

      expect(element.querySelector('.bill-remove')).toBeNull();
    });

    it('should confirm inline and delete a one-off bill', () => {
      const removed: Bill[] = [];
      fixture.componentInstance.removed.subscribe((value) => removed.push(value));
      const value = bill({ id: 7, recurringBillId: null, name: 'Presente' });
      const element = render(value);

      expect(element.querySelector('.bill-remove')?.getAttribute('aria-label')).toBe('Remover Presente');
      click(element, '.bill-remove');
      expect(text(element, '.inline-confirm .confirm-text')).toBe('Remover esta conta avulsa?');

      click(element, '.inline-confirm .confirm');
      const request = httpMock.expectOne(environment.apiUri + 'Bill/7');
      expect(request.request.method).toBe('DELETE');
      request.flush(null);
      fixture.detectChanges();

      expect(removed).toEqual([value]);
      expect(element.querySelector('.inline-confirm')).toBeNull();
    });

    it('should cancel without calling the API', () => {
      const element = render(bill({ recurringBillId: null }));
      click(element, '.bill-remove');
      click(element, '.inline-confirm .cancel');

      expect(element.querySelector('.inline-confirm')).toBeNull();
      httpMock.expectNone(() => true);
    });

    it('should show an error when the delete fails', () => {
      const removed: Bill[] = [];
      fixture.componentInstance.removed.subscribe((value) => removed.push(value));
      const element = render(bill({ id: 7, recurringBillId: null }));
      click(element, '.bill-remove');
      click(element, '.inline-confirm .confirm');

      httpMock.expectOne(environment.apiUri + 'Bill/7').flush(null, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(removed).toEqual([]);
      expect(text(element, '.inline-confirm .error-message')).toBe('Não foi possível remover a conta.');
    });
  });
});
