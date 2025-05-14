import { Routes } from '@angular/router';
import { UserLoginComponent } from './user-login/user-login.component'
import { UserSignupComponent } from './user-signup/user-signup.component'
import { ExpensesDashboardComponent } from './expenses-dashboard/expenses-dashboard.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { SessionService } from './session.service';
import { inject } from '@angular/core';

export const routes: Routes = [
    { path: '', component: LandingPageComponent }, 
    { path: 'expenses', component: ExpensesDashboardComponent, canActivate: [() => inject(SessionService).isLoggedIn()] }, 
    { path: 'login', component: UserLoginComponent, canActivate: [() => inject(SessionService).isLoggedIn() === false] },
    { path: 'signup', component: UserSignupComponent, canActivate: [() => inject(SessionService).isLoggedIn() === false] },
];
