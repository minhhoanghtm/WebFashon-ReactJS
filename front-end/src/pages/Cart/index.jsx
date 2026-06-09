import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cart.store';

const Cart = () => {
  const { items, updateItemQuantity, removeItem, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your Cart is Empty</h2>
        <p className="mt-2 text-sm text-gray-500 font-medium">Browse our product catalog to add items.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Shopping Cart</h2>
      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        {/* Cart Item List */}
        <section className="lg:col-span-8">
          <ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
            {items.map((item) => (
              <li key={item._id} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                  <img
                    src={item.variants?.[0]?.image_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=200&h=200&q=80'}
                    alt={item.name}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="ml-6 flex flex-1 flex-col justify-between">
                  <div className="flex justify-between text-base font-semibold text-gray-900">
                    <h3>{item.name}</h3>
                    <p className="ml-4">${item.new_price * (item.quantity || 1)}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateItemQuantity(item._id, (item.quantity || 1) - 1)}
                        className="px-3 py-1 font-semibold text-gray-600 hover:text-indigo-600 transition"
                      >
                        -
                      </button>
                      <span className="px-3 text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item._id, (item.quantity || 1) + 1)}
                        className="px-3 py-1 font-semibold text-gray-600 hover:text-indigo-600 transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="font-medium text-red-600 hover:text-red-500 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Order Summary */}
        <section className="mt-16 rounded-2xl bg-gray-50 border border-gray-100 p-6 sm:p-8 lg:col-span-4 lg:mt-0 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
              <dt>Order Total</dt>
              <dd>${getTotalPrice()}</dd>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/checkout"
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
            >
              Proceed to Checkout
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Cart;
