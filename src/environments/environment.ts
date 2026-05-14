// Local development environment.
// API requests are sent to /api/... which is proxied to http://localhost:8000
// by proxy.conf.json during ng serve.
export const environment = {
  production: false,
  // apiBase is intentionally empty; the interceptor prepends /api/
  // and the dev proxy rewrites /api -> http://localhost:8000
  apiBase: '',
};
