import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthStripComponent } from './month-strip.component';
import { Bill } from '../../types/bill';
import { BillMonth } from '../../types/billMonth';
import { getTranslocoModule } from '../../../testing/transloco-testing';

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
    ...overrides,
  };
}

function year(billsByMonth: Record<number, Bill[]>): BillMonth[] {
  return Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    bills: billsByMonth[index + 1] ?? [],
  }));
}

describe('MonthStripComponent', () => {
  let component: MonthStripComponent;
  let fixture: ComponentFixture<MonthStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthStripComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthStripComponent);
    component = fixture.componentInstance;
  });

  function render(months: BillMonth[], selectedMonth = 10) {
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('months', months);
    fixture.componentRef.setInput('selectedMonth', selectedMonth);
    fixture.componentRef.setInput('today', TODAY);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function cards(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll('.month-card'));
  }

  it('should render one card per month with its name', () => {
    const element = render(year({}));

    expect(cards(element).length).toBe(12);
    expect(cards(element)[0].querySelector('.month-name')?.textContent).toBe('jan.');
    expect(cards(element)[9].querySelector('.month-name')?.textContent).toBe('out.');
  });

  it('should render one dot per bill, colored by status, in due date order', () => {
    const element = render(
      year({
        10: [
          bill(1, { dueDate: '2026-10-25' }),
          bill(2, { dueDate: '2026-10-01', paidAt: '2026-10-01' }),
          bill(3, { dueDate: '2026-10-05' }),
          bill(4, { dueDate: '2026-10-09' }),
        ],
        11: [bill(5, { dueDate: '2026-11-10' })],
      })
    );

    const statusOf = (card: HTMLElement) =>
      Array.from(card.querySelectorAll('.status-dot')).map((dot) =>
        Array.from(dot.classList).find((name) => name.startsWith('status-') && name !== 'status-dot')
      );

    expect(statusOf(cards(element)[9])).toEqual([
      'status-paid',
      'status-overdue',
      'status-dueSoon',
      'status-pending',
    ]);
    expect(statusOf(cards(element)[10])).toEqual(['status-upcoming']);
    expect(statusOf(cards(element)[0])).toEqual([]);
  });

  it('should summarize each month in text', () => {
    const element = render(
      year({
        3: [bill(1, { paidAt: '2026-03-05' }), bill(2, { paidAt: '2026-03-06' })],
        9: [bill(3, { dueDate: '2026-09-05' }), bill(4, { dueDate: '2026-09-06' }), bill(5, { paidAt: '2026-09-01' })],
        10: [bill(6, { dueDate: '2026-10-05' }), bill(7)],
        11: [bill(8, { dueDate: '2026-11-05' }), bill(9, { dueDate: '2026-11-06' })],
        12: [bill(10, { dueDate: '2026-12-05' })],
      })
    );

    const summaries = cards(element).map((card) => card.querySelector('.month-summary')?.textContent);
    expect(summaries[0]).toBe('Sem contas');
    expect(summaries[2]).toBe('Tudo pago');
    expect(summaries[8]).toBe('2 atrasadas');
    expect(summaries[9]).toBe('1 atrasada');
    expect(summaries[10]).toBe('2 contas');
    expect(summaries[11]).toBe('1 conta');
  });

  it('should show the overdue count of the year', () => {
    const element = render(
      year({
        2: [bill(1, { dueDate: '2026-02-05' })],
        10: [bill(2, { dueDate: '2026-10-05' }), bill(3)],
      })
    );

    expect(element.querySelector('.overdue-year')?.textContent?.trim()).toBe('2 atrasadas este ano');
  });

  it('should hide the overdue count when nothing is overdue', () => {
    const element = render(year({ 10: [bill(1)] }));

    expect(element.querySelector('.overdue-year')).toBeNull();
  });

  it('should mark the selected month', () => {
    const element = render(year({}), 4);

    const selected = cards(element).filter((card) => card.classList.contains('selected'));
    expect(selected.length).toBe(1);
    expect(selected[0]).toBe(cards(element)[3]);
    expect(selected[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('should scroll the selected month into view when it changes', () => {
    const scrolled: Element[] = [];
    spyOn(Element.prototype, 'scrollIntoView').and.callFake(function (this: Element) {
      scrolled.push(this);
    });

    const element = render(year({}), 4);
    expect(scrolled).toEqual([cards(element)[3]]);

    fixture.detectChanges();
    expect(scrolled.length).toBe(1);

    render(year({}), 12);
    expect(scrolled[1]).toBe(cards(element)[11]);
  });

  it('should emit the clicked month', () => {
    const element = render(year({}));
    const selected: number[] = [];
    component.monthSelected.subscribe((month) => selected.push(month));

    cards(element)[1].click();

    expect(selected).toEqual([2]);
  });
});
