// Production environment.
// The Angular SPA is served by nginx at https://300clubleaderboard.com.
// API requests go to /api/... which nginx proxies to the Django container.
// Since both frontend and backend are on the same domain, no CORS needed.
export const environment = {
  production: true,
  apiBase: '',   // Same origin; nginx handles /api/ → Django
};
