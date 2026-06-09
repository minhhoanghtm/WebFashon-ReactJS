import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product.api';

export const useProducts = () => {
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productApi.getAllProducts();
      return res.data || [];
    },
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
  };
};

export const useProductDetail = (slug) => {
  const detailQuery = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await productApi.getProductBySlug(slug);
      return res.data;
    },
    enabled: !!slug,
  });

  return {
    product: detailQuery.data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
  };
};
