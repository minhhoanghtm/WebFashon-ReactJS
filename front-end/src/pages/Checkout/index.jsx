import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cart.store';
import { orderApi } from '../../api/order.api';
import CheckoutVoucherSelector from '../../components/CheckoutVoucherSelector';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Voucher states
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.new_price || item.price || 0) * (item.quantity || 1)), 0);
  };

  const calculateFinalTotal = () => {
    const sub = calculateSubtotal();
    const disc = appliedVoucher ? appliedVoucher.discountAmount : 0;
    return Math.max(0, sub - disc);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    try {
      const orderPayload = {
        fullName,
        phone,
        shippingAddress: address,
        paymentMethod: 'COD',
        items: items.map((item) => ({
          product_id: item._id,
          product_variant_id: item.variants?.[0]?._id,
          quantity: item.quantity,
          price: item.new_price,
        })),
        totalPrice: calculateFinalTotal(),
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
      };

      const res = await orderApi.createOrder(orderPayload);
      if (res.success) {
        clearCart();
        alert('Order placed successfully!');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Checkout</h2>
      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Shipping Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-4">Shipping Information</h3>
          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Shipping Address</label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-md"
            >
              {loading ? 'Processing Order...' : `Place Order (COD) - ${calculateFinalTotal().toLocaleString("vi-VN")}đ`}
            </button>
          </form>
        </div>

        {/* Mini Order Summary */}
        <div className="mt-8 lg:mt-0 lg:col-span-5 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-6">
          <div>
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-4">Your Order</h3>
            <ul className="mt-6 divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item._id} className="flex py-4 justify-between text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    <span className="text-gray-500"> x {item.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{(item.new_price || item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Voucher Section */}
          <div className="border-t border-b border-gray-200 py-4">
            <CheckoutVoucherSelector
              subtotal={calculateSubtotal()}
              appliedVoucher={appliedVoucher}
              onApply={(voucher) => setAppliedVoucher(voucher)}
              onRemove={() => setAppliedVoucher(null)}
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{calculateSubtotal().toLocaleString("vi-VN")}đ</span>
            </div>
            {appliedVoucher && (
              <div className="flex justify-between text-sm text-indigo-650 font-semibold">
                <span>Giảm giá (Voucher)</span>
                <span>-{appliedVoucher.discountAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-bold text-gray-900 font-sans">
              <span>Tổng thanh toán</span>
              <span className="text-indigo-600 text-lg">{calculateFinalTotal().toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
