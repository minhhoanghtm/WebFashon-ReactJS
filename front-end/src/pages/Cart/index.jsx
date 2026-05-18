import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";
import { getCartService } from "@/services/cart.service";
import {
  deleteCartItemService,
  getCartItemsService,
  updateCartItemService,
} from "@/services/cartItem.service";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getVariantLabel = (variantId) => {
  if (!variantId) {
    return "Mặc định";
  }

  if (typeof variantId === "object") {
    return [variantId.color, variantId.size].filter(Boolean).join(" - ");
  }

  return String(variantId).replaceAll("-", " ");
};

const mapCheckoutItem = (item) => {
  const product = item.product_id;

  return {
    _id: item._id,
    product_id: product?._id || item.product_id || "",
    variant_id: item.variant_id?._id || item.variant_id || "",
    product_name: product?.name || item.product_name || "Sản phẩm",
    product_image: product?.displayProduct?.[0] || item.product_image || "",
    price: Number(item.price || 0),
    oldPrice: Number(product?.old_price || item.oldPrice || item.price || 0),
    quantity: Number(item.quantity || 0),
    variant: getVariantLabel(item.variant_id),
  };
};

const CartPage = () => {
  useDocumentTitle("Giỏ hàng");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingItemId, setPendingItemId] = useState("");

  const loadCart = async () => {
    setIsLoading(true);
    setError("");

    try {
      //Lấy cart cua user
      const carRes = await getCartService();
      const cartData = carRes.data;
      console.log("Cart data:", cartData);

      console.log("Cart ID:", cartData[0]?._id); // Kiểm tra cart ID có tồn tại không
      //Lay cart items tu cart
      const cartItemsRes = await getCartItemsService(cartData[0]?._id);
      const cartItemsData = cartItemsRes.data;
      setCartItems(cartItemsData || []);
      setSelectedItemIds((cartItemsData || []).map((item) => item._id));
      console.log("Cart items data:", cartItemsData);
      // setCartItems(cartItemsData || []);
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
    const selectedItems = cartItems.filter((item) =>
      selectedItemIds.includes(item._id),
    );

    const subtotal = selectedItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const shippingFee = subtotal >= 800000 || subtotal === 0 ? 0 : 30000;
    const total = subtotal + shippingFee;
    const selectedQuantity = selectedItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    );

    return {
      subtotal,
      shippingFee,
      total,
      totalItems: selectedQuantity,
    };
  }, [cartItems, selectedItemIds]);

  const selectedCheckoutItems = useMemo(
    () => cartItems.filter((item) => selectedItemIds.includes(item._id)),
    [cartItems, selectedItemIds],
  );

  const checkoutItems = useMemo(
    () => selectedCheckoutItems.map(mapCheckoutItem),
    [selectedCheckoutItems],
  );

  const handleCheckout = () => {
    if (checkoutItems.length === 0) {
      return;
    }

    navigate("/checkout", {
      state: {
        checkoutItems,
        subtotal: summary.subtotal,
        shippingFee: summary.shippingFee,
        totalPrice: summary.total,
      },
    });
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedItemIds((prev) =>
      prev.length === cartItems.length ? [] : cartItems.map((item) => item._id),
    );
  };

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) {
      return;
    }
    setPendingItemId(item._id);
    setError("");

    // Optimistic update: update UI immediately
    const beforeUpdate = cartItems;
    const updatedItems = cartItems.map((i) =>
      i._id === item._id ? { ...i, quantity: nextQuantity } : i,
    );
    setCartItems(updatedItems);

    try {
      const result = await updateCartItemService(item._id, {
        quantity: nextQuantity,
      });

      // Sync with server response to ensure data consistency
      if (result.data) setCartItems(result.data);

      // Notify Header to update badge with total quantity
      const totalQuantity =
        result.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      console.log(
        "Dispatching cartUpdated with totalQuantity:",
        totalQuantity,
        "from items:",
        result.data,
      );
      console.log("Total price:", result.total);
      window.dispatchEvent(
        new CustomEvent("cartUpdated", {
          detail: { cart: result.cart, totalQuantity, total: result.total },
        }),
      );
    } catch {
      // Revert UI on error
      setCartItems(beforeUpdate);
      setError("Không thể cập nhật số lượng.");
    } finally {
      setPendingItemId("");
    }
  };

  const handleRemoveItem = async (itemId) => {
    setPendingItemId(itemId);
    setError("");

    // Optimistic update: remove item immediately
    const beforeDelete = cartItems;
    setCartItems(cartItems.filter((i) => i._id !== itemId));

    try {
      const result = await deleteCartItemService(itemId);

      // Sync with server response
      if (result.data) setCartItems(result.data);
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));

      // Notify Header to update badge with total quantity
      const totalQuantity =
        result.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      console.log(
        "Dispatching cartUpdated after delete with totalQuantity:",
        totalQuantity,
        "from items:",
        result.data,
      );
      console.log("Total price:", result.total);
      window.dispatchEvent(
        new CustomEvent("cartUpdated", {
          detail: { cart: result.cart, totalQuantity, total: result.total },
        }),
      );
    } catch {
      // Revert UI on error
      setCartItems(beforeDelete);
      setError("Không thể xóa sản phẩm khỏi giỏ hàng.");
    } finally {
      setPendingItemId("");
    }
  };
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-sm sm:px-8">
        <h1 className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
          GIỎ HÀNG
        </h1>
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
          <p className="text-xl font-semibold text-slate-900">
            Giỏ hàng đang trống
          </p>
          <p className="mt-3 text-slate-500">
            Hãy thêm vài sản phẩm để tiếp tục mua sắm.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-orange-500"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-6">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={
                    cartItems.length > 0 &&
                    selectedItemIds.length === cartItems.length
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4 accent-black"
                />
                <span>Chọn tất cả</span>
              </label>

              <span className="text-sm text-slate-500">
                {selectedCheckoutItems.length} / {cartItems.length} sản phẩm
              </span>
            </div>
            {cartItems.map((item) => {
              const product = item.product_id;
              const image = product?.displayProduct?.[0] || "";
              const isPending = pendingItemId === item._id;
              const isChecked = selectedItemIds.includes(item._id);

              return (
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex gap-4">
                    {/* checkbox + image */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItemSelection(item._id)}
                        className="mt-2 h-4 w-4 accent-black"
                      />

                      <img
                        src={image}
                        alt={product?.name}
                        className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
                      />
                    </div>

                    {/* content */}
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-orange-500">
                            {product?.slug}
                          </p>

                          <h2 className="text-lg font-semibold text-slate-900">
                            {product?.name}
                          </h2>

                          <p className="text-xs text-slate-500">
                            {getVariantLabel(item.variant_id)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(item.price)}
                          </p>
                          <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(product?.old_price)}
                          </p>
                        </div>
                      </div>

                      {/* bottom actions */}
                      <div className="flex items-center justify-between border-t pt-3">
                        {/* quantity */}
                        <div className="flex items-center rounded-full border bg-slate-50 px-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(item, item.quantity - 1)
                            }
                            className="px-3 py-1 text-lg"
                          >
                            -
                          </button>

                          <span className="min-w-10 text-center font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              handleQuantityChange(item, item.quantity + 1)
                            }
                            className="px-3 py-1 text-lg"
                          >
                            +
                          </button>
                        </div>

                        {/* price + delete */}
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-orange-500">
                            {formatCurrency(item.price * item.quantity)}
                          </p>

                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-sm font-medium text-red-500 hover:underline"
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

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
            <h2 className="text-xl font-bold text-slate-900">
              Tóm tắt đơn hàng
            </h2>

            {/* Thông tin giao hàng */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm">
              <h3 className="text-sm font-semibold text-slate-700">Thông tin giao hàng</h3>
              {user?.data ? (
                (() => {
                  const addr = user.data.addresses?.[0] || user.data.address?.[0] || null;
                  if (!addr) {
                    return (
                      <div className="mt-2 text-sm text-slate-500">
                        Chưa có địa chỉ giao hàng.{' '}
                        <Link to="/account?tab=address" className="text-orange-500 hover:underline">Thêm ngay</Link>
                      </div>
                    );
                  }

                  const parts = [];
                  if (addr.addressDetail || addr.detail) parts.push(addr.addressDetail || addr.detail);
                  if (addr.wardCode || addr.ward) parts.push(addr.wardCode || addr.ward);
                  if (addr.districtCode || addr.district) parts.push(addr.districtCode || addr.district);
                  if (addr.provinceCode || addr.city) parts.push(addr.provinceCode || addr.city);

                  return (
                    <div className="mt-2 text-sm text-slate-700">
                      <p className="font-medium">{addr.fullName}</p>
                      <p className="mt-1">{addr.phone}</p>
                      <p className="mt-1 text-slate-500">{parts.filter(Boolean).join(', ')}</p>
                      <Link to="/account?tab=address" className="mt-2 inline-block text-sm text-orange-500 hover:underline">Chỉnh sửa</Link>
                    </div>
                  );
                })()
              ) : (
                <div className="mt-2 text-sm text-slate-500">Vui lòng đăng nhập để sử dụng địa chỉ lưu sẵn.</div>
              )}
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm">
              <div className="flex justify-between">
                <span>Sản phẩm</span>
                <span>{summary.totalItems}</span>
              </div>

              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Phí ship</span>
                <span>{formatCurrency(summary.shippingFee)}</span>
              </div>

              <div className="mt-3 border-t pt-3 flex justify-between text-base font-bold">
                <span>Tổng</span>
                <span className="text-orange-500">
                  {formatCurrency(summary.total)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutItems.length === 0}
                className="block w-full rounded-2xl bg-black py-3 text-center font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Thanh toán
              </button>

              <Link
                to="/"
                className="block w-full rounded-2xl border py-3 text-center text-slate-700 hover:bg-slate-50"
              >
                Tiếp tục mua hàng
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
