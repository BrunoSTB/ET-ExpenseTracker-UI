import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { BillService } from './bill.service';
import { Bill, NewBill } from '../types/bill';
import { BillMonth } from '../types/billMonth';
import { environment } from '../../environments/environment';

describe('BillService', () => {
  let service: BillService;
  let httpMock: HttpTestingController;

  const aBill: Bill = {
    id: 7,
    recurringBillId: 3,
    name: 'Energia',
    dueDate: '2026-10-10',
    amountType: 'VariableEstimated',
    value: null,
    estimate: 127.43,
    paidAt: null,
    canDelete: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BillService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getYear', () => {
    it('should GET the bills of the given year', () => {
      const months: BillMonth[] = [{ month: 10, bills: [aBill] }];
      let result: BillMonth[] | undefined;

      service.getYear(2026).subscribe((r) => (result = r));

      const req = httpMock.expectOne(environment.apiUri + 'Bill?year=2026');
      expect(req.request.method).toBe('GET');
      req.flush(months);

      expect(result).toEqual(months);
    });
  });

  describe('create', () => {
    it('should POST the one-off bill and return the created bill', () => {
      const newBill: NewBill = {
        name: 'IPVA',
        dueDate: '2026-11-20',
        amountType: 'Fixed',
        value: 850,
      };
      let created: Bill | undefined;

      service.create(newBill).subscribe((bill) => (created = bill));

      const req = httpMock.expectOne(environment.apiUri + 'Bill');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newBill);
      req.flush({ ...aBill, id: 42, recurringBillId: null, canDelete: true, name: 'IPVA' });

      expect(created).toEqual(
        jasmine.objectContaining({ id: 42, recurringBillId: null })
      );
    });
  });

  describe('pay', () => {
    it('should PUT the payment with the value', () => {
      let paid: Bill | undefined;

      service.pay(7, 130.5).subscribe((bill) => (paid = bill));

      const req = httpMock.expectOne(environment.apiUri + 'Bill/7/Payment');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ value: 130.5 });
      req.flush({ ...aBill, value: 130.5, paidAt: '2026-10-13' });

      expect(paid?.paidAt).toBe('2026-10-13');
    });

    it('should send a null value when none is given', () => {
      service.pay(7).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'Bill/7/Payment');
      expect(req.request.body).toEqual({ value: null });
      req.flush(aBill);
    });
  });

  describe('undoPayment', () => {
    it('should DELETE the payment and return the bill', () => {
      let bill: Bill | undefined;

      service.undoPayment(7).subscribe((b) => (bill = b));

      const req = httpMock.expectOne(environment.apiUri + 'Bill/7/Payment');
      expect(req.request.method).toBe('DELETE');
      req.flush(aBill);

      expect(bill).toEqual(aBill);
    });
  });

  describe('delete', () => {
    it('should DELETE the bill', () => {
      service.delete(42).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'Bill/42');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
