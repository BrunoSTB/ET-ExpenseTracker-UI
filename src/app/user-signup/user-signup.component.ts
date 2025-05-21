import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../types/user';
import { environment } from '../../environments/environment';


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

  constructor(private router: Router, 
              private http: HttpClient) { }

  onSignupSubmit() {
    //  basic validation
    if (this.signupCredentials.password !== this.signupCredentials.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    //  add your signup logic here.
    var userInfo: User = this.signupCredentials;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    this.http.post(environment.apiUri + 'User/Register', userInfo, httpOptions)
      .subscribe({
        error: (err) => {
          console.error('Error fetching data:', err);
        }
      });

    //  redirect to login page after successful signup
    this.router.navigate(['/login']);
    alert('Registration completed!');
  }
}
