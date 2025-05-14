import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLinkActive, RouterLink } from '@angular/router'
import { Session } from '../types/session';
import { Observable } from 'rxjs';
import { SessionService } from '../session.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterLinkActive, RouterLink],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css'
})
export class TopNavbarComponent {
  session$: Observable<Session | null>;
  
  loggedOutLinks = [
    { path: '/signup', label: 'Sign Up' },
    { path: '/login', label: 'Login' },
    { path: '', label: 'Home' },
  ];

  loggedInLinks = [
    { path: '/expenses', label: 'Expenses' },
    { path: '/', label: 'Home' },
  ];

  constructor(
    private sessionService: SessionService
  ) {
    this.session$ = this.sessionService.getSession();
  }
  
  logout() {
    this.sessionService.cleanSession();
  }
}

