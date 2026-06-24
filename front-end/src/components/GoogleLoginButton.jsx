import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '@/api/googleAuth.api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';

/**
 * Google login button component.
 * On success, sends the ID token to the backend via loginWithGoogle.
 * On success response, stores the access token and user in the auth store.
 */
export const GoogleLoginButton = () => {
  const { login } = useAuthStore();

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res?.success && res?.data) {
        const { accessToken, user } = res.data;
        login(accessToken, user);
        toast.success('Đăng nhập Google thành công!');
      } else {
        toast.error('Google login failed');
      }
    } catch (err) {
      console.error('Google login error:', err);
      toast.error('Google login error');
    }
  };

  const handleError = () => {
    toast.error('Google login error');
  };

  return <GoogleLogin onSuccess={handleSuccess} onError={handleError} />;
};
