import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../services/session.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Session } from '../types/session';
import { environment } from '../../environments/environment';

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
              private router: Router,
              private http: HttpClient) {}

  onSubmit() {
    
    
    //  add your signup logic here.
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    this.http.post<Session>(environment.apiUri + 'User/Login', this.credentials, httpOptions)
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
