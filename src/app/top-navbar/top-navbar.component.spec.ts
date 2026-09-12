import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TopNavbarComponent } from './top-navbar.component';
import { SessionService } from '../services/session.service';

describe('TopNavbarComponent', () => {
  let component: TopNavbarComponent;
  let fixture: ComponentFixture<TopNavbarComponent>;
  let sessionService: SessionService;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [TopNavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TopNavbarComponent);
    component = fixture.componentInstance;
    sessionService = TestBed.inject(SessionService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function linkLabels(): string[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-link')
    ).map((el) => el.textContent!.trim());
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the logged out links when there is no session', () => {
    expect(linkLabels()).toEqual(['Sign Up', 'Login', 'Home']);
  });

  it('should show the logged in links once a session exists', () => {
    sessionService.saveSession({ username: 'bruno', accessToken: 'token' });
    fixture.detectChanges();

    expect(linkLabels()).toEqual(['Logout', 'Expenses', 'Home']);
  });

  it('should clear the session on logout', () => {
    sessionService.saveSession({ username: 'bruno', accessToken: 'token' });
    fixture.detectChanges();

    component.logout();
    fixture.detectChanges();

    expect(sessionService.isLoggedIn()).toBeFalse();
    expect(linkLabels()).toEqual(['Sign Up', 'Login', 'Home']);
  });
});
