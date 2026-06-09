import { useQuery, useMutation } from '@tanstack/react-query';
import { orderApi } from '../api/order.api';

export const useOrders = () => {
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await orderApi.getOrdersByUser();
      return res.data || [];
    },
  });

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
