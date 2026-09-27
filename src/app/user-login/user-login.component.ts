import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';
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

  constructor(private authService: AuthService,
              private sessionService: SessionService,
              private router: Router) {}

  onSubmit() {
    this.authService.login(this.credentials)
      .subscribe({
        next: (sessionData) => {
          this.sessionService.saveSession(sessionData);
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Login failed:', error);
        },
      });
  }
}
