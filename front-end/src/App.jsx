import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './store/auth.store';
import { userApi } from './api/user.api';
import { tokenStorage } from './utils/token';
import { ConsentProvider } from './context/ConsentContext';

// Toast Notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { setUser, logout, setIsLoading } = useAuthStore();

  // On initial mount, restore session if token exists
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = tokenStorage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await userApi.getMe();
        if (res.success && res.data) {
          setUser(res.data);
        } else if (!tokenStorage.getToken()) {
          logout();
        }
      } catch (err) {
        console.error('Session bootstrap failed:', err);
        // Only log out if backend explicitly rejected with 401 and refresh token is invalid
        if (err.response?.status === 401 && !tokenStorage.getToken()) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [setUser, logout, setIsLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <AppRouter />
        <ToastContainer position="top-right" autoClose={3000} />
      </ConsentProvider>
    </QueryClientProvider>
  );
};

export default App;
