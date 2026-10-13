import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringBillsPanelComponent } from './recurring-bills-panel.component';
import { RecurringBill } from '../../types/recurringBill';
import { getTranslocoModule } from '../../../testing/transloco-testing';

// Intl separates the currency symbol with a non-breaking space.
const NBSP = '\u00a0';

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

describe('RecurringBillsPanelComponent', () => {
  let fixture: ComponentFixture<RecurringBillsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringBillsPanelComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringBillsPanelComponent);
  });

  function render(recurringBills: RecurringBill[]) {
    fixture.componentRef.setInput('recurringBills', recurringBills);
    fixture.detectChanges();
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.recurring-item')
    ).map((item) =>
      Array.from(item.querySelectorAll('.recurring-name, .recurring-schedule, .recurring-amount > span'))
        .map((part) => part.textContent!.trim())
        .join(' ')
    );
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
});
