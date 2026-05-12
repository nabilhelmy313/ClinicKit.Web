export const environment = {
  production: false,
  // Empty string → all /api/* calls are relative (same origin).
  // The Angular dev-server proxy (proxy.conf.json) forwards them to http://localhost:5000.
  // This avoids CORS entirely during development.
  apiUrl: '',
};
