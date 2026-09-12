import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ExpenseFormComponent } from './expense-form.component';
import { Expense } from '../types/expenses';
import { environment } from '../../environments/environment';

describe('ExpenseFormComponent', () => {
  let component: ExpenseFormComponent;
  let fixture: ComponentFixture<ExpenseFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should post the new expense to the API', () => {
    component.biggestId = 4;
    component.currentDate = new Date(2026, 0, 1);
    component.formData = { name: 'Internet', value: 99.9 };

    component.createNewExpense();

    const req = httpMock.expectOne(environment.apiUri + 'Expense');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ id: 5, name: 'Internet', value: 99.9 })
    );
    req.flush({});
  });

  it('should emit the created expense only after the API confirms', () => {
    const emitted: Expense[] = [];
    component.formSubmit.subscribe((expense) => emitted.push(expense));
    component.formData = { name: 'Energia', value: 155.96 };

    component.createNewExpense();
    const req = httpMock.expectOne(environment.apiUri + 'Expense');
    expect(emitted.length).toBe(0);

    req.flush({});

    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe('Energia');
  });
});
