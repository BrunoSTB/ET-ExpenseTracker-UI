import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { of, throwError } from "rxjs";

@Injectable()
export class AuthService {
     
    constructor(private http: HttpClient) {
    }
      
    login(email:string, password:string ) {
      return email === "admin" &&
            password === "123"
            ? of({
                name: "admin",
                accessToken: "aaa",
              })
            : throwError(() => {
                const error: any = new Error(
                  `Usuário ou senha inválido`
                );
                error.timestamp = Date.now();
                return error;
              });
        //return this.http.post<User>('/api/login', {email, password})
            // this is just the HTTP call, 
            // we still need to handle the reception of the token
            //.shareReplay();
    }
}