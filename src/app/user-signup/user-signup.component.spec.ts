import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { UserSignupComponent } from './user-signup.component';
import { environment } from '../../environments/environment';

describe('UserSignupComponent', () => {
  let component: UserSignupComponent;
  let fixture: ComponentFixture<UserSignupComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSignupComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSignupComponent);
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

  it('should not call the API when the passwords do not match', () => {
    component.signupCredentials = {
      username: 'bruno',
      email: 'bruno@example.com',
      password: 'secret',
      confirmPassword: 'different',
    };

    component.onSignupSubmit();

    expect(httpMock.match((r) => r.url === environment.apiUri + 'User/Register').length).toBe(0);
    expect(component.errorMessage).toBeTruthy();
  });

  it('should post to the register endpoint when the passwords match', () => {
    component.signupCredentials = {
      username: 'bruno',
      email: 'bruno@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    };

    component.onSignupSubmit();

    const req = httpMock.expectOne(environment.apiUri + 'User/Register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'bruno',
      email: 'bruno@example.com',
      password: 'secret',
    });
    req.flush({});
  });

  describe('after submitting', () => {
    let router: Router;

    beforeEach(() => {
      router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.signupCredentials = {
        username: 'bruno',
        email: 'bruno@example.com',
        password: 'secret',
        confirmPassword: 'secret',
      };
      component.onSignupSubmit();
    });

    it('should navigate to login only after the API confirms', () => {
      const req = httpMock.expectOne(environment.apiUri + 'User/Register');
      expect(router.navigate).not.toHaveBeenCalled();

      req.flush({});

      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        state: { registered: true },
      });
    });

    it('should stay on the page and show an error when the API fails', () => {
      httpMock
        .expectOne(environment.apiUri + 'User/Register')
        .flush(null, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.error-message')).not.toBeNull();
    });
  });
});
