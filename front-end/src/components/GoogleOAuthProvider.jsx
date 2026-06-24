import React from 'react';
import { GoogleOAuthProvider as Provider } from '@react-oauth/google';

/**
 * Wraps the application with Google OAuth provider.
 * Uses VITE_GOOGLE_CLIENT_ID from environment variables.
 */
export const GoogleOAuthProvider = ({ children }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    console.error('[GoogleOAuthProvider] VITE_GOOGLE_CLIENT_ID is missing – Google login will not work.');
    return <>{children}</>;
  }

  return <Provider clientId={clientId}>{children}</Provider>;
};
