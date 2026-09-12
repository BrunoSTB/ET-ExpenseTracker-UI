import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { UserLoginComponent } from './user-login.component';
import { environment } from '../../environments/environment';

describe('UserLoginComponent', () => {
  let component: UserLoginComponent;
  let fixture: ComponentFixture<UserLoginComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
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
});
