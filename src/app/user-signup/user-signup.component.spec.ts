import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

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
    spyOn(window, 'alert');
    component.signupCredentials = {
      username: 'bruno',
      email: 'bruno@example.com',
      password: 'secret',
      confirmPassword: 'different',
    };

    component.onSignupSubmit();

    expect(httpMock.match(environment.apiUri + 'User/Register').length).toBe(0);
  });

  it('should post to the register endpoint when the passwords match', () => {
    spyOn(window, 'alert');
    component.signupCredentials = {
      username: 'bruno',
      email: 'bruno@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    };

    component.onSignupSubmit();

    const req = httpMock.expectOne(environment.apiUri + 'User/Register');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
