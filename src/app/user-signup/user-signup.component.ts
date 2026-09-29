import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { User } from '../types/user';


@Component({
  selector: 'app-user-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-signup.component.html',
  styleUrls: ['./user-signup.component.css']    
})
export class UserSignupComponent {
  signupCredentials = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  errorMessage: string | null = null;

  constructor(private router: Router,
              private authService: AuthService) { }

  onSignupSubmit() {
    this.errorMessage = null;

    if (this.signupCredentials.password !== this.signupCredentials.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    const { confirmPassword, ...userInfo } = this.signupCredentials;
    const user: User = userInfo;

    this.authService.register(user)
      .subscribe({
        next: () => {
          this.router.navigate(['/login'], { state: { registered: true } });
        },
        error: () => {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      });
  }
}
