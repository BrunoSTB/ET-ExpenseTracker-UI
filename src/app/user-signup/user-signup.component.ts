import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { User } from '../types/user';


@Component({
  selector: 'app-user-signup', //  selector, though not used in the provided HTML, is good practice.
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-signup.component.html', //  path to the HTML template.
  styleUrls: ['./user-signup.component.css']    //  path to the CSS stylesheet.
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

    //  basic validation
    if (this.signupCredentials.password !== this.signupCredentials.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    //  confirmPassword é só da UI, não vai para a API.
    const { confirmPassword, ...userInfo } = this.signupCredentials;
    const user: User = userInfo;

    this.authService.register(user)
      .subscribe({
        next: () => {
          //  redirect to login page after successful signup
          this.router.navigate(['/login'], { state: { registered: true } });
        },
        error: () => {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      });
  }
}
