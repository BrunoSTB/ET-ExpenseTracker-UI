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
    canDelete: false,
    ...overrides,
  };
}

describe('BillRowComponent', () => {
  let component: BillRowComponent;
  let fixture: ComponentFixture<BillRowComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillRowComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BillRowComponent);
    component = fixture.componentInstance;
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

    it('should not offer to remove bills of an active recurring bill', () => {
      const element = render(bill());

      expect(element.querySelector('.bill-remove')).toBeNull();
    });

    it('should offer to remove a bill of an ended recurring bill', () => {
      const element = render(bill({ recurringBillId: 3, canDelete: true, paidAt: null }));

      expect(element.querySelector('.bill-remove')).not.toBeNull();
    });

    it('should confirm inline and delete a one-off bill', () => {
      const removed: Bill[] = [];
      fixture.componentInstance.removed.subscribe((value) => removed.push(value));
      const value = bill({ id: 7, recurringBillId: null, canDelete: true, name: 'Presente' });
      const element = render(value);

      expect(element.querySelector('.bill-remove')?.getAttribute('aria-label')).toBe('Remover Presente');
      click(element, '.bill-remove');
      expect(text(element, '.inline-confirm .confirm-text')).toBe('Remover esta conta?');

      click(element, '.inline-confirm .confirm');
      const request = httpMock.expectOne(environment.apiUri + 'Bill/7');
      expect(request.request.method).toBe('DELETE');
      request.flush(null);
      fixture.detectChanges();

      expect(removed).toEqual([value]);
      expect(element.querySelector('.inline-confirm')).toBeNull();
    });

    it('should cancel without calling the API', () => {
      const element = render(bill({ recurringBillId: null, canDelete: true }));
      click(element, '.bill-remove');
      click(element, '.inline-confirm .cancel');

      expect(element.querySelector('.inline-confirm')).toBeNull();
      httpMock.expectNone(() => true);
    });

    it('should show an error when the delete fails', () => {
      const removed: Bill[] = [];
      fixture.componentInstance.removed.subscribe((value) => removed.push(value));
      const element = render(bill({ id: 7, recurringBillId: null, canDelete: true }));
      click(element, '.bill-remove');
      click(element, '.inline-confirm .confirm');

      httpMock.expectOne(environment.apiUri + 'Bill/7').flush(null, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(removed).toEqual([]);
      expect(text(element, '.inline-confirm .error-message')).toBe('Não foi possível remover a conta.');
    });
  });

  describe('payment', () => {
    let paid: (number | null)[];
    let undone: number;

    beforeEach(() => {
      paid = [];
      undone = 0;
      component.pay.subscribe((value) => paid.push(value));
      component.undoPayment.subscribe(() => undone++);
    });

    function toggle(element: HTMLElement) {
      return element.querySelector<HTMLButtonElement>('button.pay-toggle')!;
    }

    function clickToggle(element: HTMLElement) {
      toggle(element).click();
      fixture.detectChanges();
    }

    async function openValueInput(value: Bill) {
      const element = render(value);
      clickToggle(element);
      // ngModel writes the value asynchronously.
      await fixture.whenStable();
      fixture.detectChanges();
      return element;
    }

    function valueInput(element: HTMLElement) {
      return element.querySelector<HTMLInputElement>('input.payment-value')!;
    }

    function type(element: HTMLElement, value: string) {
      valueInput(element).value = value;
      valueInput(element).dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function submit(element: HTMLElement) {
      element
        .querySelector('form.payment-form')!
        .dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    }

    it('should render the circle as a toggle button for an unpaid bill', () => {
      const button = toggle(render(bill()));

      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('aria-label')).toBe('Marcar Aluguel como paga');
      expect(button.querySelector('.status-dot')?.classList).toContain('status-pending');
    });

    it('should render the circle as pressed for a paid bill', () => {
      const button = toggle(render(bill({ paidAt: '2026-10-04' })));

      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.getAttribute('aria-label')).toBe('Desfazer pagamento de Aluguel');
    });

    it('should pay a fixed bill with one click, without asking the value', () => {
      const element = render(bill());

      clickToggle(element);

      expect(paid).toEqual([null]);
      expect(element.querySelector('.payment-form')).toBeNull();
    });

    it('should undo the payment of a paid bill', () => {
      const element = render(bill({ amountType: 'VariableEstimated', value: 130, paidAt: '2026-10-04' }));

      clickToggle(element);

      expect(undone).toBe(1);
      expect(paid).toEqual([]);
      expect(element.querySelector('.payment-form')).toBeNull();
    });

    it('should ask the value of a variable bill with the estimate filled in', async () => {
      const element = await openValueInput(
        bill({ amountType: 'VariableEstimated', value: null, estimate: 127.43 })
      );

      expect(paid).toEqual([]);
      expect(valueInput(element).value).toBe('127.43');
      expect(document.activeElement).toBe(valueInput(element));
      expect(text(element, '.payment-label')).toBe('Valor pago');
    });

    it('should pay a variable bill with the value typed', async () => {
      const element = await openValueInput(
        bill({ amountType: 'VariableEstimated', value: null, estimate: 127.43 })
      );

      type(element, '131.9');
      submit(element);

      expect(paid).toEqual([131.9]);
      expect(element.querySelector('.payment-form')).toBeNull();
    });

    it('should start empty and require a value when there is no estimate', async () => {
      const element = await openValueInput(bill({ amountType: 'VariableOnArrival', value: null }));
      const confirm = element.querySelector<HTMLButtonElement>('.payment-confirm')!;

      expect(valueInput(element).value).toBe('');
      expect(confirm.disabled).toBeTrue();

      submit(element);
      expect(paid).toEqual([]);

      type(element, '80');
      expect(confirm.disabled).toBeFalse();
      submit(element);
      expect(paid).toEqual([80]);
    });

    it('should cancel with Esc and give the focus back to the circle', async () => {
      const element = await openValueInput(bill({ amountType: 'VariableOnArrival', value: null }));

      valueInput(element).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(element.querySelector('.payment-form')).toBeNull();
      expect(document.activeElement).toBe(toggle(element));
      expect(paid).toEqual([]);
    });

    it('should cancel with the cancel button', async () => {
      const element = await openValueInput(bill({ amountType: 'VariableOnArrival', value: null }));

      element.querySelector<HTMLButtonElement>('.payment-cancel')!.click();
      fixture.detectChanges();

      expect(element.querySelector('.payment-form')).toBeNull();
      expect(paid).toEqual([]);
    });

    it('should close the value input when the circle is clicked again', async () => {
      const element = await openValueInput(bill({ amountType: 'VariableOnArrival', value: null }));

      clickToggle(element);

      expect(element.querySelector('.payment-form')).toBeNull();
      expect(paid).toEqual([]);
    });
  });
});
