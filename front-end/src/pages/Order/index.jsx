import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  getOrdersByUserIdService,
  updateOrderService,
} from "@/services/order.service";
import Loading from "@/components/Loading";
import { formatCurrency, formatDate } from "@/utils/format";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const orderStatusMap = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const paymentMethodMap = {
  cod: "Thanh toán khi nhận hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

// Helper function to generate slug from product name

const UserAccountManagement = () => {
  useDocumentTitle("Lịch sử mua hàng");

  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("all");

  // 👉 STATE MỚI: mở/đóng chi tiết từng order
  const [openOrders, setOpenOrders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  //Call API lấy thông tin oder của user
  useEffect(() => {
    const fetchData = async () => {
      try {
        //Lấy order của user
        const ordersData = await getOrdersByUserIdService();
        console.log("ordersData:", ordersData);
        console.log("orderId:", ordersData.orders._id);
        setOrders(ordersData.orders);

        //Lấy order items của order
      } catch (err) {
        setError("Lấy dữ liệu thất bại");
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // ================= TOGGLE ORDER =================
  const toggleOrder = (orderId) => {
    setOpenOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // ================= MERGE ORDERS =================
  const ordersWithItems = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [orders]);

  const getProductSlug = (item) => item.product_slug || item.product?.slug;

  // ================= FILTER =================
  const filteredOrders = useMemo(() => {
    if (selectedOrderStatus === "all") return ordersWithItems;

    return ordersWithItems.filter((o) => o.status === selectedOrderStatus);
  }, [ordersWithItems, selectedOrderStatus]);

  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: "Bạn có chắc?",
      text: "Bạn muốn hủy đơn hàng này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hủy đơn",
      cancelButtonText: "Đóng",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await updateOrderService(orderId, {
        status: "cancelled",
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "cancelled" } : o,
          ),
        );

        toast.success("Hủy đơn hàng thành công");
      } else {
        toast.error("Hủy đơn thất bại");
      }
    } catch (err) {
      toast.error("Hủy đơn thất bại");
    }
  };

  return isLoading ? (
    <Loading />
  ) : (
    <div>
      {/* BACK */}
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500">
        ← Quay lại
      </button>

      <h1 className="text-center py-10 text-4xl font-bold">Lịch Sử Mua Hàng</h1>

      {/* FILTER */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedOrderStatus("all")}
          className={`px-4 py-2 rounded-full border ${
            selectedOrderStatus === "all" ? "bg-black text-white" : ""
          }`}
        >
          Tất cả
        </button>

        {Object.entries(orderStatusMap).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSelectedOrderStatus(value)}
            className={`px-4 py-2 rounded-full border ${
              selectedOrderStatus === value ? "bg-orange-500 text-white" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ORDERS */}
      <div className="mt-10">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500">Không có đơn hàng</p>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="border rounded-xl p-5 mb-5">
              {/* ORDER HEADER */}
              <div className="flex justify-between">
                <div>
                  <p>Mã: {order._id}</p>
                  <p>{orderStatusMap[order.status]}</p>
                  <p>{formatDate(order.updatedAt || order.createdAt) || ""}</p>
                  <p>{paymentMethodMap[order.payment_method]}</p>
                </div>

                <div>
                  <b>{formatCurrency(order.total_price)}</b>
                </div>
              </div>

              {/* MORE BUTTON */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => toggleOrder(order._id)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  {openOrders[order._id] ? "Ẩn bớt" : "Xem chi tiết"}
                </button>
                {(order.status === "pending" ||
                  order.status === "confirmed") && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="mt-3 ml-3 text-red-500 hover:underline"
                  >
                    Hủy đơn hàng
                  </button>
                )}
                {order.status === "cancelled" && (
                  <p className="text-red-500">Đơn hàng đã bị hủy</p>
                )}
                {order.status === "shipping" && (
                  <div className="flex items-center gap-2">
                    <button className="border rounded-2xl p-2 hover:bg-green-500 hover:text-white">
                      Đã nhận hàng
                    </button>
                    <button className="border rounded-2xl p-2 text-red-500 hover:bg-red-500 hover:text-white">
                      Chưa nhận được hàng
                    </button>
                  </div>
                )}
                {order.status === "delivered" &&
                  order.updatedAt &&
                  new Date() - new Date(order.updatedAt) <=
                    7 * 24 * 60 * 60 * 1000 && (
                    <div className="flex items-center gap-2">
                      <button className="border rounded-2xl p-2 hover:bg-gray-500 hover:text-white">
                        Trả hàng/Hoàn tiền
                      </button>
                    </div>
                  )}
              </div>

              {/* ORDER ITEMS */}
              {openOrders[order._id] && (
                <div className="mt-5 border-t pt-4">
                  {order.items?.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-2xl p-2 m-1 bg-gray-100"
                    >
                      {/* Ưu tiên slug snapshot, fallback sang slug hiện tại từ product */}
                      <Link
                        to={
                          getProductSlug(item)
                            ? `/product/${getProductSlug(item)}`
                            : "#"
                        }
                        className="flex gap-3 py-3 border-b last:border-b-0"
                      >
                        <img
                          src={item.variant?.image_url || item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover"
                        />

                        <div>
                          <p>{item.product_name}</p>
                          <p>Số lượng: {item.quantity}</p>
                          <p className="text-sm text-gray-500">
                            <span>{item.variant?.color || "Không có màu"}</span>
                            <span>
                              , {item.variant?.size || "Không có kích thước"}
                            </span>
                          </p>
                        </div>

                        <div className="ml-auto">
                          {formatCurrency(item.price)}
                        </div>
                      </Link>

                      {/* Xử lý từng sản phẩm trong đơn hàng*/}
                      {order.status === "delivered" ? (
                        <div className="flex gap-2 mt-2">
                          <Link
                            to={`/reviews/create?product_id=${item.product_id}&order_id=${order._id}`}
                            state={{
                              item,
                              order,
                            }}
                            className="border rounded-2xl p-2 hover:bg-green-500 hover:text-white inline-block"
                          >
                            Đánh giá sản phẩm
                          </Link>
                          <Link
                            to={
                              getProductSlug(item)
                                ? `/product/${getProductSlug(item)}`
                                : "#"
                            }
                            className="border rounded-2xl  p-2 text-yellow-500 hover:bg-yellow-300 hover:text-white"
                          >
                            Mua lại
                          </Link>
                        </div>
                      ) : (
                        <Link
                          to={
                            getProductSlug(item)
                              ? `/product/${getProductSlug(item)}`
                              : "#"
                          }
                          className="border rounded-2xl my-3 text-yellow-500 hover:bg-yellow-300 hover:text-white"
                        >
                          Mua lại
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default UserAccountManagement;
