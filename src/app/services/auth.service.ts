import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Session } from "../types/session";
import { User } from "../types/user";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }) {
    return this.http.post<Session>(
      environment.apiUri + "User/Login",
      credentials
    );
  }

  register(user: User) {
    return this.http.post(environment.apiUri + "User/Register", user);
  }
}
