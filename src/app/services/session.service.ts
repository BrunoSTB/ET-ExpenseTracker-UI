import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Session } from "../types/session";

const SESSION_KEY = "session";

@Injectable({
  providedIn: "root",
})

export class SessionService {
  private session =
    new BehaviorSubject<Session | null>(null);

  constructor() {
    this.restoreSession();
  }

  restoreSession() {
    const sessionJson = localStorage.getItem(SESSION_KEY);

    if (!sessionJson) {
      return;
    }

    try {
      const sessionData: Session = JSON.parse(sessionJson);
      this.session.next(sessionData);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  saveSession(sessionData: Session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

    this.session.next(sessionData);
  }

  cleanSession() {
    localStorage.removeItem(SESSION_KEY);
    this.session.next(null);
  }

  getSession() {
    return this.session.asObservable();
  }

  getToken() {
    const accessToken = this.session.value?.accessToken;

    return accessToken ? `Bearer ${accessToken}` : null;
  }

  isLoggedIn() {
    return this.session.value !== null;
  }
}
