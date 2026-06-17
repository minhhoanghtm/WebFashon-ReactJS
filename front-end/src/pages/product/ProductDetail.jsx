import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../api/product.api';
import { useCartStore } from '../../store/cart.store';
import { formatCurrency } from '../../utils/format';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await productApi.getProductBySlug(slug);
      return res.data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-red-600">Product not found</h3>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* Product Image */}
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-2xl bg-gray-100">
          <img
            src={product.variants?.[0]?.image_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Product Info */}
        <div className="mt-8 lg:mt-0 lg:pl-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-2xl font-bold text-indigo-600">{formatCurrency(product.new_price)}</span>
            {product.old_price > product.new_price && (
              <span className="text-lg text-gray-400 line-through">{formatCurrency(product.old_price)}</span>
            )}
          </div>
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">{product.description || 'No description available.'}</p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => addItem(product)}
              className="flex w-full max-w-xs items-center justify-center rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
