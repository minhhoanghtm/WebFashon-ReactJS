import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './store/auth.store';
import { userApi } from './api/user.api';

// Toast Notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { setUser, logout, setIsLoading } = useAuthStore();

  // On initial mount, restore session if token exists
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await Promise.race([
          userApi.getMe(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), 5000)
          )
        ]);
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[v0] Session bootstrap skipped (API unavailable):', err.message);
        // Don't logout on API failure - allow app to load in dev mode
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [setUser, logout, setIsLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </QueryClientProvider>
  );
};

export default App;
