import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { UserLoginComponent } from './user-login.component';
import { SessionService } from '../services/session.service';
import { environment } from '../../environments/environment';

describe('UserLoginComponent', () => {
  let component: UserLoginComponent;
  let fixture: ComponentFixture<UserLoginComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [UserLoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserLoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call the API before the form is submitted', () => {
    expect(httpMock.match(environment.apiUri + 'User/Login').length).toBe(0);
  });

  it('should post the credentials to the login endpoint on submit', () => {
    component.credentials = { username: 'bruno', password: 'secret' };

    component.onSubmit();

    const req = httpMock.expectOne(environment.apiUri + 'User/Login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'bruno',
      password: 'secret',
    });
    req.flush({ username: 'bruno', accessToken: 'token-123' });
  });

  it('should save the session and go home when the login succeeds', () => {
    const router = TestBed.inject(Router);
    const sessionService = TestBed.inject(SessionService);
    spyOn(router, 'navigate');
    component.credentials = { username: 'bruno', password: 'secret' };

    component.onSubmit();
    const req = httpMock.expectOne(environment.apiUri + 'User/Login');
    expect(sessionService.isLoggedIn()).toBeFalse();

    req.flush({ username: 'bruno', accessToken: 'token-123' });

    expect(sessionService.isLoggedIn()).toBeTrue();
    expect(sessionService.getToken()).toBe('Bearer token-123');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not save a session when the login fails', () => {
    const sessionService = TestBed.inject(SessionService);
    component.onSubmit();

    httpMock
      .expectOne(environment.apiUri + 'User/Login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(sessionService.isLoggedIn()).toBeFalse();
  });

  it('should clear the previous error when submitting again', () => {
    component.errorMessage = 'Login failed.';

    component.onSubmit();

    expect(component.errorMessage).toBeNull();
    httpMock
      .expectOne(environment.apiUri + 'User/Login')
      .flush({ username: 'bruno', accessToken: 'token-123' });
  });

  describe('registration notice', () => {
    function createWithNavigationState(state?: Record<string, unknown>) {
      // O componente lê o state da navegação em curso no construtor, então o
      // spy precisa existir antes de criar uma nova instância.
      const router = TestBed.inject(Router);
      spyOn(router, 'getCurrentNavigation').and.returnValue(
        { extras: { state } } as ReturnType<Router['getCurrentNavigation']>
      );

      const newFixture = TestBed.createComponent(UserLoginComponent);
      newFixture.detectChanges();
      return newFixture;
    }

    it('should show the success message when coming from the signup', () => {
      const newFixture = createWithNavigationState({ registered: true });

      expect(newFixture.componentInstance.successMessage).toBeTruthy();
      expect(
        newFixture.nativeElement.querySelector('.success-message')
      ).not.toBeNull();
    });

    it('should not show the success message on a regular visit', () => {
      const newFixture = createWithNavigationState(undefined);

      expect(newFixture.componentInstance.successMessage).toBeNull();
      expect(newFixture.nativeElement.querySelector('.success-message')).toBeNull();
    });
  });

  it('should show an error message when the login fails', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.onSubmit();

    httpMock
      .expectOne(environment.apiUri + 'User/Login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.error-message')).not.toBeNull();
  });
});
