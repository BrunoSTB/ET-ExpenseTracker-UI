import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { RecurringBillService } from './recurring-bill.service';
import { NewRecurringBill, RecurringBill } from '../types/recurringBill';
import { environment } from '../../environments/environment';

describe('RecurringBillService', () => {
  let service: RecurringBillService;
  let httpMock: HttpTestingController;

  const aRecurringBill: RecurringBill = {
    id: 3,
    name: 'Aluguel',
    dueDay: 5,
    amountType: 'Fixed',
    fixedValue: 1500,
    startMonth: '2026-01-01',
    endMonth: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecurringBillService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('list', () => {
    it('should GET the active recurring bills', () => {
      let result: RecurringBill[] | undefined;

      service.list().subscribe((r) => (result = r));

      const req = httpMock.expectOne(environment.apiUri + 'RecurringBill');
      expect(req.request.method).toBe('GET');
      req.flush([aRecurringBill]);

      expect(result).toEqual([aRecurringBill]);
    });
  });

  describe('create', () => {
    it('should POST the recurring bill and return the created one', () => {
      const newRecurringBill: NewRecurringBill = {
        name: 'Energia',
        dueDay: 10,
        amountType: 'VariableEstimated',
        fixedValue: null,
        startMonth: '2026-10-01',
      };
      let created: RecurringBill | undefined;

      service.create(newRecurringBill).subscribe((r) => (created = r));

      const req = httpMock.expectOne(environment.apiUri + 'RecurringBill');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newRecurringBill);
      req.flush({ ...aRecurringBill, ...newRecurringBill, id: 9 });

      expect(created?.id).toBe(9);
    });
  });

  describe('update', () => {
    it('should PUT the recurring bill by id', () => {
      const changes = {
        name: 'Aluguel',
        dueDay: 10,
        amountType: 'Fixed' as const,
        fixedValue: 1600,
      };

      service.update(3, changes).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'RecurringBill/3');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(changes);
      req.flush({ ...aRecurringBill, ...changes });
    });
  });

  describe('delete', () => {
    it('should DELETE the recurring bill by id', () => {
      service.delete(3).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'RecurringBill/3');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
