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
    this.restoreSession(); // on page refresh, restore session
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
      // Conteúdo inválido no storage não deve derrubar o bootstrap do app.
      localStorage.removeItem(SESSION_KEY);
    }
  }

  saveSession(sessionData: Session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

    this.session.next(sessionData); // sends a new value to whomever is listeting to the observable
  }

  cleanSession() {
    localStorage.removeItem(SESSION_KEY);
    this.session.next(null);
  }

  getSession() {
    return this.session.asObservable();
  }

  /** Valor pronto para o header Authorization, ou null se não houver sessão. */
  getToken() {
    const accessToken = this.session.value?.accessToken;

    return accessToken ? `Bearer ${accessToken}` : null;
  }

  isLoggedIn() {
    return this.session.value !== null;
  }
}
