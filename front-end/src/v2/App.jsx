import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { tokenStorage } from "@/utils/token";
import V2Router from "./router";

function SessionBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setIsLoading = useAuthStore((s) => s.setIsLoading);
  useEffect(() => {
    if (!tokenStorage.getToken()) { setIsLoading(false); return; }
    userApi.getMe().then((r) => { const user = r?.data?.data ?? r?.data ?? r; if (user) setUser(user); }).catch(() => {}).finally(() => setIsLoading(false));
  }, [setUser, setIsLoading]);
  return <V2Router />;
}
export default function App() { return <QueryClientProvider client={queryClient}><SessionBootstrap /></QueryClientProvider>; }
