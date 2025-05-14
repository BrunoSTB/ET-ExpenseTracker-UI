import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


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

  constructor(private router: Router) { }

  onSignupSubmit() {
    //  add your signup logic here.
    console.log('Signup form submitted:', this.signupCredentials);
    //  basic validation
    if (this.signupCredentials.password !== this.signupCredentials.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    //  redirect to login page after successful signup
    this.router.navigate(['/login']);
  }
}
