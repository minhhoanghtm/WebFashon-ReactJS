import React from "react";
import { Check, X, ClipboardList, Package, Truck, Smile, AlertCircle } from "lucide-react";
import { formatDate } from "@/utils/format";

const OrderTimeline = ({ order }) => {
  const { status, createdAt, updatedAt } = order;

  if (status === "cancelled") {
    const steps = [
      {
        title: "Đặt hàng thành công",
        description: "Đơn hàng đã được tạo thành công trên hệ thống.",
        date: createdAt,
        icon: ClipboardList,
        state: "completed",
      },
      {
        title: "Đã hủy đơn hàng",
        description: "Đơn hàng đã được hủy theo yêu cầu.",
        date: updatedAt,
        icon: X,
        state: "cancelled",
      },
    ];

    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {steps.map((step, stepIdx) => (
            <li key={step.title}>
              <div className="relative pb-8">
                {stepIdx !== steps.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-red-50 text-red-500 border border-red-100">
                      <step.icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                    {step.date && (
                      <div className="text-right text-xs whitespace-nowrap text-gray-400">
                        {formatDate(step.date)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Define the standard steps
  const steps = [
    {
      key: "pending",
      title: "Đặt hàng thành công",
      description: "Đơn hàng của bạn đã được tiếp nhận.",
      icon: ClipboardList,
      targetStatuses: ["pending", "confirmed", "shipping", "delivered"],
      getDate: () => createdAt,
    },
    {
      key: "confirmed",
      title: "Đã xác nhận",
      description: "Người bán đang chuẩn bị hàng gửi cho bạn.",
      icon: Package,
      targetStatuses: ["confirmed", "shipping", "delivered"],
      getDate: () => (["confirmed", "shipping", "delivered"].includes(status) ? updatedAt : null),
    },
    {
      key: "shipping_carrier",
      title: "Đã bàn giao cho đơn vị vận chuyển",
      description: "Đơn vị vận chuyển đã nhận kiện hàng từ người bán.",
      icon: Truck,
      targetStatuses: ["shipping", "delivered"],
      getDate: () => (["shipping", "delivered"].includes(status) ? updatedAt : null),
    },
    {
      key: "shipping",
      title: "Đang giao hàng",
      description: "Shipper đang trên đường giao hàng đến địa chỉ nhận.",
      icon: Truck,
      targetStatuses: ["shipping", "delivered"],
      getDate: () => (["shipping", "delivered"].includes(status) ? updatedAt : null),
    },
    {
      key: "delivered",
      title: "Giao hàng thành công",
      description: "Đơn hàng đã được giao thành công.",
      icon: Smile,
      targetStatuses: ["delivered"],
      getDate: () => (status === "delivered" ? updatedAt : null),
    },
  ];

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => {
          // Check if this step is completed
          const isCompleted = step.targetStatuses.includes(status);
          const date = step.getDate();
          
          return (
            <li key={step.title}>
              <div className="relative pb-8">
                {stepIdx !== steps.length - 1 ? (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                      isCompleted && stepIdx < steps.findIndex((s) => s.key === status)
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      ) : (
                        <step.icon className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isCompleted ? "text-gray-900 font-semibold" : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                    {date && (
                      <div className="text-right text-xs whitespace-nowrap text-gray-400">
                        {formatDate(date)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OrderTimeline;
