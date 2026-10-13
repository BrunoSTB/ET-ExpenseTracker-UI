import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AddBillFormComponent } from './add-bill-form.component';
import { RecurringBill } from '../../types/recurringBill';
import { environment } from '../../../environments/environment';
import { getTranslocoModule } from '../../../testing/transloco-testing';

const RECURRING: RecurringBill = {
  id: 4,
  name: 'Aluguel',
  dueDay: 5,
  amountType: 'Fixed',
  fixedValue: 1500,
  startMonth: '2026-01-01',
  endMonth: null,
};

describe('AddBillFormComponent', () => {
  let fixture: ComponentFixture<AddBillFormComponent>;
  let component: AddBillFormComponent;
  let httpMock: HttpTestingController;
  let savedCount: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBillFormComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddBillFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    savedCount = 0;
    component.saved.subscribe(() => savedCount++);
  });

  afterEach(() => {
    httpMock.verify();
  });

  async function render(recurringBill: RecurringBill | null = null) {
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 2);
    fixture.componentRef.setInput('recurringBill', recurringBill);
    fixture.detectChanges();
    // Lets ngModel write the values to the inputs.
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function element() {
    return fixture.nativeElement as HTMLElement;
  }

  function input(id: string) {
    return element().querySelector<HTMLInputElement & HTMLSelectElement>(`#${id}`);
  }

  function type(id: string, value: string) {
    const field = input(id)!;
    field.value = value;
    field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  function check(id: string, checked: boolean) {
    const field = input(id)!;
    field.checked = checked;
    field.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submit() {
    element().querySelector<HTMLElement>('.submit')!.click();
    fixture.detectChanges();
  }

  function errors() {
    return Array.from(element().querySelectorAll('.field-error')).map((error) => error.textContent!.trim());
  }

  describe('adding', () => {
    it('should start empty, fixed and repeating', async () => {
      await render();

      expect(element().querySelector('.panel-title')?.textContent?.trim()).toBe('Nova conta');
      expect(input('bill-name')!.value).toBe('');
      expect(input('bill-amount-type')!.value).toBe('Fixed');
      expect(input('bill-repeats')!.checked).toBeTrue();
      expect(input('bill-value')).not.toBeNull();
      expect(element().querySelector('.edit-notice')).toBeNull();
      expect(document.activeElement).toBe(input('bill-name'));
    });

    it('should offer the three amount types', async () => {
      await render();

      expect(
        Array.from(input('bill-amount-type')!.options).map((option) => option.textContent!.trim())
      ).toEqual(['Valor fixo', 'Variável, com estimativa', 'Variável, informado na chegada']);
    });

    it('should require name, due day and value for fixed bills', async () => {
      await render();
      submit();

      expect(errors()).toEqual([
        'Informe o nome.',
        'Informe um dia entre 1 e 31.',
        'Informe um valor maior que zero.',
      ]);
      expect(input('bill-name')!.getAttribute('aria-invalid')).toBe('true');
    });

    it('should reject due days outside 1-31 and non-positive values', async () => {
      await render();
      type('bill-name', 'Aluguel');
      type('bill-due-day', '32');
      type('bill-value', '0');
      submit();

      expect(errors()).toEqual(['Informe um dia entre 1 e 31.', 'Informe um valor maior que zero.']);

      type('bill-due-day', '0');
      expect(errors()).toContain('Informe um dia entre 1 e 31.');

      type('bill-due-day', '31');
      type('bill-value', '10');
      expect(errors()).toEqual([]);

      submit();
      httpMock.expectOne(environment.apiUri + 'RecurringBill').flush({});
    });

    it('should hide the value and not require it for variable bills', async () => {
      await render();
      type('bill-name', 'Luz');
      type('bill-due-day', '10');
      type('bill-amount-type', 'VariableEstimated');

      expect(input('bill-value')).toBeNull();
      submit();
      expect(errors()).toEqual([]);

      const request = httpMock.expectOne(environment.apiUri + 'RecurringBill');
      expect(request.request.body).toEqual({
        name: 'Luz',
        dueDay: 10,
        amountType: 'VariableEstimated',
        fixedValue: null,
      });
      request.flush({});
    });

    it('should create a recurring bill when it repeats every month', async () => {
      await render();
      type('bill-name', '  Aluguel ');
      type('bill-due-day', '5');
      type('bill-value', '1500.5');
      submit();

      const request = httpMock.expectOne(environment.apiUri + 'RecurringBill');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        name: 'Aluguel',
        dueDay: 5,
        amountType: 'Fixed',
        fixedValue: 1500.5,
      });
      expect(element().querySelector<HTMLButtonElement>('.submit')!.disabled).toBeTrue();
      request.flush({ ...RECURRING });

      expect(savedCount).toBe(1);
    });

    it('should create a one-off bill in the open month otherwise', async () => {
      await render();
      type('bill-name', 'Presente');
      type('bill-due-day', '31');
      type('bill-value', '80');
      check('bill-repeats', false);

      expect(element().querySelector('.one-off-hint')?.textContent?.trim()).toBe(
        'Desmarcado, a conta é criada só em fevereiro de 2026.'
      );
      submit();

      const request = httpMock.expectOne(environment.apiUri + 'Bill');
      expect(request.request.method).toBe('POST');
      // February has no 31st, so the bill is due on its last day.
      expect(request.request.body).toEqual({
        name: 'Presente',
        dueDate: '2026-02-28',
        amountType: 'Fixed',
        value: 80,
      });
      request.flush({});

      expect(savedCount).toBe(1);
    });

    it('should show an error and keep the form when saving fails', async () => {
      await render();
      type('bill-name', 'Aluguel');
      type('bill-due-day', '5');
      type('bill-value', '10');
      submit();

      httpMock
        .expectOne(environment.apiUri + 'RecurringBill')
        .flush(null, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(savedCount).toBe(0);
      expect(element().querySelector('.error-message')?.textContent?.trim()).toBe(
        'Não foi possível salvar a conta. Tente novamente.'
      );
      expect(element().querySelector<HTMLButtonElement>('.submit')!.disabled).toBeFalse();
    });

    it('should emit cancelled', async () => {
      let cancelled = 0;
      component.cancelled.subscribe(() => cancelled++);
      await render();
      element().querySelector<HTMLElement>('.cancel')!.click();

      expect(cancelled).toBe(1);
    });
  });

  describe('editing', () => {
    it('should fill the form and warn that the change applies from this month on', async () => {
      await render(RECURRING);

      expect(element().querySelector('.panel-title')?.textContent?.trim()).toBe('Editar conta recorrente');
      expect(element().querySelector('.edit-notice')?.textContent?.trim()).toBe(
        'A mudança vale do mês atual em diante. Contas pagas e meses anteriores não mudam.'
      );
      expect(input('bill-name')!.value).toBe('Aluguel');
      expect(input('bill-due-day')!.value).toBe('5');
      expect(input('bill-amount-type')!.value).toBe('Fixed');
      expect(input('bill-value')!.value).toBe('1500');
      expect(input('bill-repeats')).toBeNull();
    });

    it('should update the recurring bill', async () => {
      await render(RECURRING);
      type('bill-value', '1600');
      submit();

      const request = httpMock.expectOne(environment.apiUri + 'RecurringBill/4');
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({
        name: 'Aluguel',
        dueDay: 5,
        amountType: 'Fixed',
        fixedValue: 1600,
      });
      request.flush({ ...RECURRING, fixedValue: 1600 });

      expect(savedCount).toBe(1);
    });

    it('should drop the value when switching to a variable type', async () => {
      await render(RECURRING);
      type('bill-amount-type', 'VariableOnArrival');
      submit();

      const request = httpMock.expectOne(environment.apiUri + 'RecurringBill/4');
      expect(request.request.body.fixedValue).toBeNull();
      expect(request.request.body.amountType).toBe('VariableOnArrival');
      request.flush({});
    });
  });
});
