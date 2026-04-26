import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteCartItemApi,
  getCartApi,
  initializeCartApi,
  updateCartItemApi,
} from "../../api/cartApi";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getVariantLabel = (variantId) => {
  if (!variantId) {
    return "Mặc định";
  }

  return variantId.replaceAll("-", " ");
};

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingItemId, setPendingItemId] = useState("");

  const loadCart = async () => {
    setIsLoading(true);
    setError("");

    try {
      await initializeCartApi();
      const response = await getCartApi();
      const result = await response.json();

      setCart(result.cart);
      setCartItems(result.cartItems || []);
    } catch {
      setError("Không thể tải giỏ hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const summary = useMemo(() => {
    const subtotal = cartItems.reduce(
      (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const shippingFee = subtotal >= 800000 || subtotal === 0 ? 0 : 30000;
    const total = subtotal + shippingFee;

    return {
      subtotal,
      shippingFee,
      total,
      totalItems: cart?.total_items || 0,
    };
  }, [cart?.total_items, cartItems]);

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) {
      return;
    }

    setPendingItemId(item._id);
    setError("");

    try {
      const response = await updateCartItemApi(item._id, { quantity: nextQuantity });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Không thể cập nhật số lượng.");
        return;
      }

      setCart(result.cart);
      setCartItems(result.cartItems || []);
    } catch {
      setError("Không thể cập nhật số lượng.");
    } finally {
      setPendingItemId("");
    }
  };

  const handleRemoveItem = async (itemId) => {
    setPendingItemId(itemId);
    setError("");

    try {
      const response = await deleteCartItemApi(itemId);
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Không thể xóa sản phẩm khỏi giỏ hàng.");
        return;
      }

      setCart(result.cart);
      setCartItems(result.cartItems || []);
    } catch {
      setError("Không thể xóa sản phẩm khỏi giỏ hàng.");
    } finally {
      setPendingItemId("");
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-sm sm:px-8">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
          Cart
        </p>
        <h1 className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
          GIỎ HÀNG CỦA BẠN
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
          Kiểm tra lại sản phẩm, cập nhật số lượng và chuyển sang checkout khi sẵn sàng.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
          Đang tải giỏ hàng...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-4 text-red-600 shadow-sm">
          {error}
        </div>
      ) : cartItems.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">Giỏ hàng đang trống</p>
          <p className="mt-3 text-slate-500">
            Hãy thêm vài sản phẩm để tiếp tục mua sắm.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-orange-500"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            {cartItems.map((item) => {
              const product = item.product;
              const image = product?.displayProduct?.[0] || "";
              const isPending = pendingItemId === item._id;

              return (
                <article
                  key={item._id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                    <img
                      src={image}
                      alt={product?.name || "Sản phẩm"}
                      className="h-40 w-full rounded-3xl object-cover"
                    />

                    <div className="flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                            {product?.slug || "product"}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            {product?.name}
                          </h2>
                          <p className="mt-2 text-sm text-slate-500">
                            Danh mục: {product?.category_id || "Chưa cập nhật"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Phân loại: {getVariantLabel(item.variant_id)}
                          </p>
                        </div>

                        <div className="text-left lg:text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(item.price)}
                          </p>
                          <p className="mt-1 text-sm text-slate-400 line-through">
                            {formatCurrency(product?.old_price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={isPending || item.quantity <= 1}
                            className="h-10 w-10 rounded-full text-xl font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="min-w-12 text-center text-base font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={isPending}
                            className="h-10 w-10 rounded-full text-xl font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-orange-500">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={isPending}
                            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-6">
            <p className="text-sm uppercase tracking-[0.24em] text-orange-500">
              Cart summary
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Tóm tắt đơn hàng
            </h2>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between text-slate-600">
                <span>Số sản phẩm</span>
                <span>{summary.totalItems}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(summary.shippingFee)}</span>
              </div>
              <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center justify-between text-xl font-bold text-slate-900">
                  <span>Tổng thanh toán</span>
                  <span>{formatCurrency(summary.total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                to="/checkout"
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-4 text-base font-bold uppercase tracking-[0.16em] text-white transition hover:bg-orange-500"
              >
                Tiến hành checkout
              </Link>
              <Link
                to="/products"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50"
              >
                Thêm sản phẩm khác
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
