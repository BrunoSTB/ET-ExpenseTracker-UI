import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Session } from "../types/session";

const ACCESS_TOKEN_KEY = "accessToken";

@Injectable({
  providedIn: "root",
})

export class SessionService {
  private session =
    new BehaviorSubject<Session | null>(null);

  constructor() {
    this.restoreSession(); // on page refresh, restore session
  }

  restoreSession() {
    const sessionJson = sessionStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    if (!sessionJson) {
      return;
    }

    const sessionData: Session =
      JSON.parse(sessionJson);
    this.session.next(sessionData);
  }

  saveSession(sessionData: Session) {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'Bearer ' + sessionData.accessToken);

    this.session.next(sessionData); // sends a new value to whomever is listeting to the observable 
  }

  cleanSession() {
    sessionStorage.clear();
    this.session.next(null);
  }

  getSession() {
    return this.session.asObservable();
  }

  isLoggedIn() {
    return this.session.value !== null;
  }
}