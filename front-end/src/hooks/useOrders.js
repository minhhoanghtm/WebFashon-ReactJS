import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { orderApi } from '../api/order.api';
import { useAuthStore } from '../store/auth.store';
import { tokenStorage } from '../utils/token';
import { ENV } from '../config/env';

export const useOrders = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [socketConnected, setSocketConnected] = useState(false);
  const socketUrl = useMemo(() => ENV.API_BASE_URL.replace(/\/api\/?$/, '') || '/', []);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await orderApi.getOrdersByUser();
      return res.data || [];
    },
    // Refetch only while the authenticated Socket.IO connection is unavailable.
    refetchInterval: isAuthenticated && !socketConnected ? 30_000 : false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    const token = tokenStorage.getToken();
    const userId = user?._id || user?.id || tokenStorage.decodeToken(token)?.userId;
    if (!token || !userId) return undefined;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1_500,
    });
    const refreshOrders = () => queryClient.invalidateQueries({ queryKey: ['orders'] });
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join', userId);
      refreshOrders();
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('order:created', refreshOrders);
    socket.on('order:status_changed', refreshOrders);
    socket.on('payment:updated', refreshOrders);

    return () => {
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [isAuthenticated, queryClient, socketUrl, user?._id, user?.id]);

  const createOrderMutation = useMutation({
    mutationFn: orderApi.createOrder,
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    createOrder: createOrderMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
  };
};
