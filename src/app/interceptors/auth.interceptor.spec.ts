import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { SessionService } from '../services/session.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add the Authorization header when there is a session', () => {
    sessionService.saveSession({ username: 'bruno', accessToken: 'token-123' });

    http.get('/api/expenses').subscribe();

    const req = httpMock.expectOne('/api/expenses');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('should not add the Authorization header when there is no session', () => {
    http.get('/api/expenses').subscribe();

    const req = httpMock.expectOne('/api/expenses');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
