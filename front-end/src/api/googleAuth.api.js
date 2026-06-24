import axiosClient from '@/api/axiosClient';

/**
 * Sends Google ID token to backend for authentication.
 * Expected backend endpoint: /auth/google (POST { idToken })
 */
export const loginWithGoogle = (idToken) =>
  axiosClient.post('/auth/google', { idToken });
