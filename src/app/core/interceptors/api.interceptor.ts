import { HttpInterceptorFn } from '@angular/common/http';

/**
 * API interceptor for handling requests to the backend.
 * In development, requests to /api/* are proxied via proxy.conf.json.
 * In production, configure the API_BASE_URL environment variable.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone request to add Accept header for JSON responses
  // This ensures Django REST Framework returns JSON instead of HTML
  const jsonReq = req.clone({
    setHeaders: {
      Accept: 'application/json',
    },
  });

  return next(jsonReq);
};
