// Mock API for development without backend

export const mockApiInterceptor = (axiosInstance) => {
  const mockData = {
    user: {
      _id: 'mock-user-123',
      fullName: 'Demo User',
      email: 'demo@example.com',
      avatar: null,
      role: 'customer',
    },
    products: [
      {
        _id: 'prod-1',
        name: 'Classic White T-Shirt',
        category: 'Tops',
        price: 299000,
        old_price: 399000,
        rating: 4.5,
        badge: 'New',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
      },
      {
        _id: 'prod-2',
        name: 'Black Denim Jeans',
        category: 'Bottoms',
        price: 599000,
        old_price: 799000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=600&fit=crop',
      },
      {
        _id: 'prod-3',
        name: 'Navy Blue Sweater',
        category: 'Tops',
        price: 449000,
        old_price: 599000,
        rating: 4.3,
        badge: 'Sale',
        image: 'https://images.unsplash.com/photo-1556821552-5ff63b1b78d5?w=500&h=600&fit=crop',
      },
    ],
  };

  // Intercept responses
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const { config } = error;
      
      // Mock responses for common endpoints
      if (config.url?.includes('/api/user/me') || config.url?.includes('/user/me')) {
        return Promise.resolve({
          data: { success: true, data: mockData.user },
          status: 200,
        });
      }
      
      if (config.url?.includes('/api/products') || config.url?.includes('/products')) {
        return Promise.resolve({
          data: { success: true, data: mockData.products },
          status: 200,
        });
      }

      // For other endpoints, return a generic error
      console.warn('[v0] API call failed (backend unavailable):', config.url);
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export const mockData = {
  user: mockData.user,
  products: mockData.products,
};
