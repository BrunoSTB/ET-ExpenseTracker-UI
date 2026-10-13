import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";
import { environment } from "../../environments/environment";
import { UserPreferences } from "../types/userPreferences";
import { SessionService } from "./session.service";

// Same defaults as the server, used until the user's preferences are loaded.
export const DEFAULT_PREFERENCES: UserPreferences = {
  currency: "BRL",
  locale: "pt-BR",
};

// Currency and locale drive number/date formatting; they are independent of
// the UI language, which Transloco handles.
@Injectable({
  providedIn: "root",
})
export class PreferencesService {
  private preferences = new BehaviorSubject<UserPreferences>(
    DEFAULT_PREFERENCES
  );

  constructor(private http: HttpClient, sessionService: SessionService) {
    // Don't carry one user's preferences over to the next login.
    sessionService.getSession().subscribe((session) => {
      if (!session) {
        this.preferences.next(DEFAULT_PREFERENCES);
      }
    });
  }

  getPreferences() {
    return this.preferences.asObservable();
  }

  load() {
    return this.http
      .get<UserPreferences>(environment.apiUri + "User/Preferences")
      .pipe(tap((preferences) => this.preferences.next(preferences)));
  }

  update(preferences: UserPreferences) {
    return this.http
      .put<void>(environment.apiUri + "User/Preferences", preferences)
      .pipe(tap(() => this.preferences.next(preferences)));
  }
}
