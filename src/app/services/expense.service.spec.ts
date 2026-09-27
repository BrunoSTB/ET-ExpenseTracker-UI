import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ExpenseService } from './expense.service';
import { Expense } from '../types/expenses';
import { environment } from '../../environments/environment';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should GET the expenses for the given year', () => {
      service.list(2026).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'Expense?year=2026');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('create', () => {
    it('should POST the expense', () => {
      const expense = new Expense(1, 'Internet', 99.9, new Date(2026, 0, 1));

      service.create(expense).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'Expense');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expense);
      req.flush({});
    });
  });

  describe('deleteByIds', () => {
    it('should DELETE with each id sent exactly once', () => {
      service.deleteByIds([1, 2]).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === environment.apiUri + 'Expense/DeleteByIds'
      );
      expect(req.request.method).toBe('DELETE');
      expect(req.request.params.getAll('ids')).toEqual(['1', '2']);
      req.flush({});
    });

    it('should support a single id', () => {
      service.deleteByIds([5]).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('DeleteByIds'));
      expect(req.request.params.getAll('ids')).toEqual(['5']);
      req.flush({});
    });
  });
});
