const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

export const ENV = {
  API_BASE_URL:
    import.meta.env.VITE_API_URL ||
    (isLocalhost
      ? 'http://localhost:5000/api'
      : import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  isDev: import.meta.env.DEV,
};
