import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const { login, logout, setUser, setIsLoading } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      if (res.success && res.data) {
        const { accessToken, user } = res.data;
        login(accessToken, user);
      }
    },
  });

  const getProfileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      setIsLoading(true);
      try {
        const res = await userApi.getMe();
        if (res.success && res.data) {
          setUser(res.data);
        }
        return res.data;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: useAuthStore.getState().isAuthenticated,
  });

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    profile: getProfileQuery.data,
    isLoadingProfile: getProfileQuery.isLoading,
  };
};

export default useAuth;
