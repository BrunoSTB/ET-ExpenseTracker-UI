import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { SessionService } from "../services/session.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessionService).getToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: token },
    })
  );
};
