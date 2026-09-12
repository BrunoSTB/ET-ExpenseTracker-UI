import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have the 'ET - Expense Tracker' title`, () => {
    expect(component.title).toEqual('ET - Expense Tracker');
  });

  it('should render the top navbar and the router outlet', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-top-navbar')).not.toBeNull();
    expect(compiled.querySelector('.navbar-brand')?.textContent).toContain(
      'ET - Expense Tracker'
    );
  });
});
