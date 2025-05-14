import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensesCardComponent } from './expenses-card.component';

describe('ExpensesCardComponent', () => {
  let component: ExpensesCardComponent;
  let fixture: ComponentFixture<ExpensesCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpensesCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
