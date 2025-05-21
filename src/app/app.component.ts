import { Component, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavbarComponent } from './top-navbar/top-navbar.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    TopNavbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ET - Expense Tracker';
   ngOnInit() {
    if (isDevMode()) {
      console.log(environment.apiUri);
    } else {
      console.log('Production! : ' + environment.apiUri);
    }
  }
}
