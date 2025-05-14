import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SessionService } from '../session.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.css'
})
export class UserLoginComponent {
  credentials = {
    username: '',
    password: ''
  }

  constructor(private sessionService: SessionService,
              private router: Router) {}

  onSubmit() {
    
    console.log('login submitted: ', this.credentials);

    this.fakeApiCall(this.credentials.username, this.credentials.password)?.subscribe({
      next: (response) => {
        this.sessionService.saveSession(response);
        this.router.navigate(["/"]);
      },
      error: (erro) => {
        alert(erro);
        this.credentials.username = '';
        this.credentials.password = '';
      },
    });
  }

  fakeApiCall(
    usuario: string,
    senha: string
  ) {
    return usuario === "admin" &&
      senha === "123"
      ? // Usuário válido
        of({
          name: "admin",
          accessToken: "aaa",
        })
      : // Usuário inválido
        throwError(() => {
          const error: any = new Error(
            `Usuário ou senha inválido`
          );
          error.timestamp = Date.now();
          return error;
        });
  }
}
