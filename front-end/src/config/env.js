const isStagingOrProd =
  typeof window !== 'undefined' &&
  (window.location.port === '8081' || window.location.port === '80' || window.location.port === '' || !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname));

export const ENV = {
  API_BASE_URL: isStagingOrProd
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
  isDev: import.meta.env.DEV,
};
