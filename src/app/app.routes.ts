import { Routes, Router } from '@angular/router';
import { UserLoginComponent } from './user-login/user-login.component'
import { UserSignupComponent } from './user-signup/user-signup.component'
import { ExpensesDashboardComponent } from './expenses-dashboard/expenses-dashboard.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { SessionService } from './services/session.service';
import { inject } from '@angular/core';

const requireLoggedIn = () => inject(SessionService).isLoggedIn() || inject(Router).createUrlTree(['/']);
const requireLoggedOut = () => !inject(SessionService).isLoggedIn() || inject(Router).createUrlTree(['/']);

export const routes: Routes = [
    { path: '', component: LandingPageComponent }, 
    { path: 'expenses', component: ExpensesDashboardComponent, canActivate: [requireLoggedIn] }, 
    { path: 'login', component: UserLoginComponent, canActivate: [requireLoggedOut] },
    { path: 'signup', component: UserSignupComponent, canActivate: [requireLoggedOut] },
    { path: '**', redirectTo: '' },
];
