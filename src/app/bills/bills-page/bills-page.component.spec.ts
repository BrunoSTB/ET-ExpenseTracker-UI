import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { BillsPageComponent } from './bills-page.component';
import { Bill } from '../../types/bill';
import { BillMonth } from '../../types/billMonth';
import { RecurringBill } from '../../types/recurringBill';
import { environment } from '../../../environments/environment';
import { getTranslocoModule } from '../../../testing/transloco-testing';

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

const RECURRING: RecurringBill[] = [
  {
    id: 1,
    name: 'Aluguel',
    dueDay: 5,
    amountType: 'Fixed',
    fixedValue: 1500,
    startMonth: '2026-01-01',
    endMonth: null,
  },
];

describe('BillsPageComponent', () => {
  let component: BillsPageComponent;
  let fixture: ComponentFixture<BillsPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [BillsPageComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BillsPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Pin today to Wednesday, 8 Oct 2026.
    component.today = new Date(2026, 9, 8);
    component.year = 2026;
    component.selectedMonth = 10;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function expectYear(year: number) {
    return httpMock.expectOne(environment.apiUri + `Bill?year=${year}`);
  }

  function init(billMonths: BillMonth[] = []) {
    fixture.detectChanges();
    httpMock.expectOne(environment.apiUri + 'User/Preferences').flush({
      currency: 'BRL',
      locale: 'pt-BR',
    });
    httpMock.expectOne(environment.apiUri + 'RecurringBill').flush(RECURRING);
    expectYear(2026).flush(billMonths);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(selector: string) {
    return (fixture.nativeElement as HTMLElement)
      .querySelector(selector)
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
  }

  function stripCards(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.month-card'));
  }

  function click(selector: string) {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector)!.click();
    fixture.detectChanges();
  }

  it('should show a loading message until the year arrives', () => {
    fixture.detectChanges();

    expect(text('.loading')).toBe('Carregando contas…');
    expect(fixture.nativeElement.querySelector('app-month-strip')).toBeNull();

    httpMock.expectOne(environment.apiUri + 'User/Preferences').flush({ currency: 'BRL', locale: 'pt-BR' });
    httpMock.expectOne(environment.apiUri + 'RecurringBill').flush([]);
    expectYear(2026).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.loading')).toBeNull();
  });

  it('should select the current month', () => {
    init();

    expect(text('.month-title')).toBe('outubro de 2026');
    expect(stripCards()[9].classList).toContain('selected');
  });

  it('should fill the months the API left out', () => {
    init([{ month: 10, bills: [bill(1)] }]);

    expect(component.months.length).toBe(12);
    expect(component.months.map((month) => month.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(component.months[9].bills.length).toBe(1);
    expect(component.months[0].bills).toEqual([]);
  });

  it('should render the recurring bills and the legend', () => {
    init();

    expect(text('app-recurring-bills-panel .recurring-name')).toBe('Aluguel');
    expect(fixture.nativeElement.querySelectorAll('app-status-legend .legend-item').length).toBe(5);
  });

  it('should show the bills of the month picked in the strip', () => {
    init([
      { month: 3, bills: [bill(1, { name: 'Março', dueDate: '2026-03-10', paidAt: '2026-03-09' })] },
      { month: 10, bills: [bill(2, { name: 'Outubro' })] },
    ]);

    expect(text('app-month-detail .bill-name')).toBe('Outubro');

    stripCards()[2].click();
    fixture.detectChanges();

    expect(text('.month-title')).toBe('março de 2026');
    expect(text('app-month-detail .bill-name')).toBe('Março');
    expect(stripCards()[2].classList).toContain('selected');
    expect(stripCards()[9].classList).not.toContain('selected');
  });

  it('should move through the months with the arrows and update the strip', () => {
    init();

    click('.nav-button.previous');
    expect(text('.month-title')).toBe('setembro de 2026');
    expect(stripCards()[8].classList).toContain('selected');

    click('.nav-button.next');
    click('.nav-button.next');
    expect(text('.month-title')).toBe('novembro de 2026');
    expect(stripCards()[10].classList).toContain('selected');
  });

  it('should load the next year after December', () => {
    init();
    component.selectMonth(12);
    fixture.detectChanges();

    click('.nav-button.next');
    expect(text('.loading')).toBe('Carregando contas…');

    expectYear(2027).flush([{ month: 1, bills: [bill(1, { name: 'Janeiro', dueDate: '2027-01-10' })] }]);
    fixture.detectChanges();

    expect(component.year).toBe(2027);
    expect(text('.month-title')).toBe('janeiro de 2027');
    expect(text('app-month-detail .bill-name')).toBe('Janeiro');
    expect(text('.strip-year')).toBe('2027');
  });

  it('should load the previous year before January', () => {
    init();
    component.selectMonth(1);
    fixture.detectChanges();

    click('.nav-button.previous');
    expectYear(2025).flush([]);
    fixture.detectChanges();

    expect(component.year).toBe(2025);
    expect(text('.month-title')).toBe('dezembro de 2025');
  });

  it('should only keep the latest year when navigating quickly', () => {
    init();
    component.selectMonth(12);
    component.nextMonth();
    const stale = expectYear(2027);
    component.previousMonth();
    expect(stale.cancelled).toBeTrue();

    expectYear(2026).flush([{ month: 12, bills: [bill(1, { name: 'Dezembro', dueDate: '2026-12-10' })] }]);
    fixture.detectChanges();

    expect(component.year).toBe(2026);
    expect(text('app-month-detail .bill-name')).toBe('Dezembro');
  });

  it('should show an error when the bills fail to load', () => {
    fixture.detectChanges();
    httpMock.expectOne(environment.apiUri + 'User/Preferences').flush({ currency: 'BRL', locale: 'pt-BR' });
    httpMock.expectOne(environment.apiUri + 'RecurringBill').flush([]);
    expectYear(2026).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text('.error-message')).toBe('Não foi possível carregar suas contas. Tente novamente mais tarde.');
    expect(component.isLoading).toBeFalse();
  });

  it('should keep the default preferences when they fail to load', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(environment.apiUri + 'User/Preferences')
      .flush(null, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(environment.apiUri + 'RecurringBill').flush([]);
    expectYear(2026).flush([]);
    fixture.detectChanges();

    expect(component.preferences).toEqual({ currency: 'BRL', locale: 'pt-BR' });
    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();
  });

  it('should format with the user preferences', () => {
    fixture.detectChanges();
    httpMock.expectOne(environment.apiUri + 'User/Preferences').flush({ currency: 'USD', locale: 'en-US' });
    httpMock.expectOne(environment.apiUri + 'RecurringBill').flush([]);
    expectYear(2026).flush([{ month: 10, bills: [bill(1, { value: 1234.5 })] }]);
    fixture.detectChanges();

    expect(text('.month-title')).toBe('October 2026');
    expect(text('app-month-detail .bill-amount')).toBe('$1,234.50');
  });

  describe('actions', () => {
    function expectReload(billMonths: BillMonth[] = [], recurring: RecurringBill[] = RECURRING) {
      httpMock.expectOne(environment.apiUri + 'RecurringBill').flush(recurring);
      expectYear(2026).flush(billMonths);
      fixture.detectChanges();
    }

    it('should open the add form from the month footer and reload after saving', () => {
      init();
      expect(fixture.nativeElement.querySelector('app-add-bill-form')).toBeNull();

      click('.add-bill');
      expect(text('app-add-bill-form .panel-title')).toBe('Nova conta');

      component.onFormSaved();
      fixture.detectChanges();
      // The data stays on screen while it reloads.
      expect(fixture.nativeElement.querySelector('.loading')).toBeNull();
      expectReload([{ month: 10, bills: [bill(1, { name: 'Nova' })] }]);

      expect(fixture.nativeElement.querySelector('app-add-bill-form')).toBeNull();
      expect(text('app-month-detail .bill-name')).toBe('Nova');
    });

    it('should close the form on cancel', () => {
      init();
      click('.add-bill');
      click('app-add-bill-form .cancel');

      expect(fixture.nativeElement.querySelector('app-add-bill-form')).toBeNull();
    });

    it('should open the edit form from the recurring bills panel', () => {
      init();
      click('.recurring-edit');

      expect(text('app-add-bill-form .panel-title')).toBe('Editar conta recorrente');
      expect(component.form?.recurringBill).toEqual(RECURRING[0]);
    });

    it('should reload after removing a recurring bill and close its edit form', () => {
      init([{ month: 10, bills: [bill(1, { recurringBillId: 1 })] }]);
      click('.recurring-edit');
      click('.recurring-remove');
      expect(text('.confirm-text')).toContain('A conta não paga a partir de outubro será removida.');

      click('.inline-confirm .confirm');
      httpMock.expectOne(environment.apiUri + 'RecurringBill/1').flush(null);
      fixture.detectChanges();
      expectReload([], []);

      expect(fixture.nativeElement.querySelector('app-add-bill-form')).toBeNull();
      expect(text('app-recurring-bills-panel .empty')).toBe('Nenhuma conta recorrente.');
    });

    it('should reload after removing a one-off bill', () => {
      init([{ month: 10, bills: [bill(5, { name: 'Presente' })] }]);
      click('.bill-remove');
      click('.inline-confirm .confirm');
      httpMock.expectOne(environment.apiUri + 'Bill/5').flush(null);
      fixture.detectChanges();
      expectReload([]);

      expect(text('app-month-detail .empty')).toBe('Nenhuma conta neste mês.');
    });

    it('should render the preferences menu', () => {
      init();

      expect(text('app-preferences-menu .preferences-toggle')).toContain('Preferências');
    });
  });
});
