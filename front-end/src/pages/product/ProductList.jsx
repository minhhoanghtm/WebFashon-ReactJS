import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/product.api';
import { useCartStore } from '../../store/cart.store';

const ProductList = () => {
  const { addItem } = useCartStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productApi.getAllProducts();
      return res.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-red-600">Failed to load products</h3>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Our Products</h2>
      <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        {data.map((product) => (
          <div key={product._id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition">
            <Link to={`/product/${product.slug || product._id || product.id}`} className="block">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-xl bg-gray-100 group-hover:opacity-75 transition">
                <img
                  src={product.variants?.[0]?.image_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&h=400&q=80'}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700">{product.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base font-bold text-indigo-600">${product.new_price}</span>
                  {product.old_price > product.new_price && (
                    <span className="text-sm text-gray-400 line-through">${product.old_price}</span>
                  )}
                </div>
              </div>
            </Link>
            <div className="mt-6">
              <button
                onClick={() => addItem(product)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
