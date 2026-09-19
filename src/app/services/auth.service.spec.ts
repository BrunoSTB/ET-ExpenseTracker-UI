import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post the credentials to the login endpoint', () => {
    service.login({ username: 'bruno', password: 'secret' }).subscribe();

    const req = httpMock.expectOne(environment.apiUri + 'User/Login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'bruno', password: 'secret' });
    req.flush({ username: 'bruno', accessToken: 'token-123' });
  });

  it('should resolve with the session returned by the API', async () => {
    const resultPromise = new Promise((resolve) => {
      service.login({ username: 'bruno', password: 'secret' }).subscribe(resolve);
    });

    httpMock
      .expectOne(environment.apiUri + 'User/Login')
      .flush({ username: 'bruno', accessToken: 'token-123' });

    expect(await resultPromise).toEqual({
      username: 'bruno',
      accessToken: 'token-123',
    });
  });

  it('should post the user info to the register endpoint', () => {
    const user = {
      username: 'bruno',
      email: 'bruno@example.com',
      password: 'secret',
    };

    service.register(user).subscribe();

    const req = httpMock.expectOne(environment.apiUri + 'User/Register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(user);
    req.flush({});
  });
});
