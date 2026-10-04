import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './user-login.component.css'
})
export class UserLoginComponent {
  credentials = {
    username: '',
    password: ''
  }
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService,
              private sessionService: SessionService,
              private router: Router) {
    if (this.router.getCurrentNavigation()?.extras.state?.['registered']) {
      this.successMessage = 'Registration completed! You can now log in.';
    }
  }

  onSubmit() {
    this.errorMessage = null;
    this.authService.login(this.credentials)
      .subscribe({
        next: (sessionData) => {
          this.sessionService.saveSession(sessionData);
          this.router.navigate(['/']);
        },
        error: () => {
          this.errorMessage = 'Login failed. Check your username and password.';
        },
      });
  }
}
