import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { RecurringBillsPanelComponent } from './recurring-bills-panel.component';
import { RecurringBill } from '../../types/recurringBill';
import { Bill } from '../../types/bill';
import { BillMonth } from '../../types/billMonth';
import { environment } from '../../../environments/environment';
import { getTranslocoModule } from '../../../testing/transloco-testing';

// Intl separates the currency symbol with a non-breaking space.
const NBSP = ' ';
const TODAY = new Date(2026, 9, 8);

function recurringBill(overrides: Partial<RecurringBill> = {}): RecurringBill {
  return {
    id: 1,
    name: 'Aluguel',
    dueDay: 5,
    amountType: 'Fixed',
    fixedValue: 1500,
    startMonth: '2026-01-01',
    endMonth: null,
    ...overrides,
  };
}

function bill(id: number, overrides: Partial<Bill> = {}): Bill {
  return {
    id,
    recurringBillId: 1,
    name: 'Aluguel',
    dueDate: '2026-10-05',
    amountType: 'Fixed',
    value: 1500,
    estimate: null,
    paidAt: null,
    canDelete: false,
    ...overrides,
  };
}

describe('RecurringBillsPanelComponent', () => {
  let fixture: ComponentFixture<RecurringBillsPanelComponent>;
  let component: RecurringBillsPanelComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringBillsPanelComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringBillsPanelComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('today', TODAY);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function render(recurringBills: RecurringBill[], months: BillMonth[] = []) {
    fixture.componentRef.setInput('recurringBills', recurringBills);
    fixture.componentRef.setInput('months', months);
    fixture.detectChanges();
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.recurring-item')
    ).map((item) =>
      Array.from(item.querySelectorAll('.recurring-name, .recurring-schedule, .recurring-amount > span'))
        .map((part) => part.textContent!.trim())
        .join(' ')
    );
  }

  function element() {
    return fixture.nativeElement as HTMLElement;
  }

  function click(selector: string) {
    element().querySelector<HTMLElement>(selector)!.click();
    fixture.detectChanges();
  }

  function text(selector: string) {
    return element().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  }

  it('should render a fixed bill with its day and value', () => {
    expect(render([recurringBill()])).toEqual([
      `Aluguel Todo mês no dia 5 R$${NBSP}1.500,00`,
    ]);
  });

  it('should render variable bills with their hint', () => {
    expect(
      render([
        recurringBill({ id: 2, name: 'Luz', dueDay: 10, amountType: 'VariableEstimated', fixedValue: null }),
        recurringBill({ id: 3, name: 'Água', dueDay: 31, amountType: 'VariableOnArrival', fixedValue: null }),
      ])
    ).toEqual([
      'Luz Todo mês no dia 10 Variável estimativa: últimos 3 meses',
      'Água Todo mês no dia 31 Variável informe quando chegar',
    ]);
  });

  it('should render an empty state', () => {
    expect(render([])).toEqual([]);
    expect(fixture.nativeElement.querySelector('.empty')?.textContent).toContain(
      'Nenhuma conta recorrente.'
    );
  });

  it('should ask to edit the clicked item', () => {
    const edited: RecurringBill[] = [];
    component.edit.subscribe((value) => edited.push(value));
    const value = recurringBill();
    render([value]);

    expect(element().querySelector('.recurring-edit')?.getAttribute('aria-label')).toBe('Editar Aluguel');
    click('.recurring-edit');

    expect(edited).toEqual([value]);
  });

  describe('removing', () => {
    const months: BillMonth[] = [
      { month: 9, bills: [bill(1, { dueDate: '2026-09-05' })] },
      { month: 10, bills: [bill(2, { dueDate: '2026-10-05' }), bill(3, { dueDate: '2026-10-06', paidAt: '2026-10-06' })] },
      { month: 11, bills: [bill(4, { dueDate: '2026-11-05' })] },
      { month: 12, bills: [bill(5, { dueDate: '2026-12-05' }), bill(6, { recurringBillId: 2, dueDate: '2026-12-05' })] },
    ];

    it('should confirm inline with the unpaid bills from the current month on', () => {
      render([recurringBill()], months);
      expect(element().querySelector('.inline-confirm')).toBeNull();

      click('.recurring-remove');

      expect(element().querySelector('.recurring-remove')?.getAttribute('aria-expanded')).toBe('true');
      expect(text('.confirm-text')).toBe(
        'Parar de acompanhar Aluguel? As 3 contas não pagas a partir de outubro serão removidas. ' +
          'Contas pagas e meses anteriores continuam como estão.'
      );
    });

    it('should use the singular and the empty texts', () => {
      render([recurringBill()], [{ month: 10, bills: [bill(2)] }]);
      click('.recurring-remove');
      expect(text('.confirm-text')).toContain('A conta não paga a partir de outubro será removida.');

      render([recurringBill()], []);
      click('.recurring-remove');
      expect(text('.confirm-text')).toContain('Nenhuma conta não paga a partir de outubro será removida.');
    });

    it('should close the confirmation on cancel without calling the API', () => {
      render([recurringBill()], months);
      click('.recurring-remove');
      click('.inline-confirm .cancel');

      expect(element().querySelector('.inline-confirm')).toBeNull();
      httpMock.expectNone(() => true);
    });

    it('should delete the recurring bill and emit removed', () => {
      const removed: RecurringBill[] = [];
      component.removed.subscribe((value) => removed.push(value));
      const value = recurringBill();
      render([value], months);
      click('.recurring-remove');
      click('.inline-confirm .confirm');

      const request = httpMock.expectOne(environment.apiUri + 'RecurringBill/1');
      expect(request.request.method).toBe('DELETE');
      expect(element().querySelector<HTMLButtonElement>('.inline-confirm .confirm')!.disabled).toBeTrue();
      request.flush(null);
      fixture.detectChanges();

      expect(removed).toEqual([value]);
      expect(element().querySelector('.inline-confirm')).toBeNull();
    });

    it('should keep the confirmation open with an error when the delete fails', () => {
      const removed: RecurringBill[] = [];
      component.removed.subscribe((value) => removed.push(value));
      render([recurringBill()], months);
      click('.recurring-remove');
      click('.inline-confirm .confirm');

      httpMock
        .expectOne(environment.apiUri + 'RecurringBill/1')
        .flush(null, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(removed).toEqual([]);
      expect(text('.inline-confirm .error-message')).toBe('Não foi possível remover a conta recorrente.');
      expect(element().querySelector<HTMLButtonElement>('.inline-confirm .confirm')!.disabled).toBeFalse();
    });
  });
});
