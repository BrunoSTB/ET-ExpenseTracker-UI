import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // AuthService não declara providedIn: 'root', então precisa ser provido
      // explicitamente aqui. Ver #11 — o serviço ainda é um mock.
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should resolve with an access token for the hardcoded credentials', async () => {
    const result = await firstValueFrom(service.login('admin', '123'));

    expect(result.accessToken).toBeTruthy();
  });

  it('should reject any other credentials', async () => {
    await expectAsync(
      firstValueFrom(service.login('someone', 'wrong'))
    ).toBeRejectedWithError('Usuário ou senha inválido');
  });
});
