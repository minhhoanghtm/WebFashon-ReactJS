import React from "react";
import { Check, X, ClipboardList, Package, Truck, Smile } from "lucide-react";
import { formatDate } from "@/utils/format";

const OrderTimeline = ({ order }) => {
  const { status, createdAt, updatedAt } = order;

  if (status === "cancelled") {
    const cancelledSteps = [
      {
        title: "Đặt hàng thành công",
        description: "Đơn hàng đã được tạo thành công trên hệ thống.",
        date: createdAt,
        Icon: ClipboardList,
      },
      {
        title: "Đã hủy đơn hàng",
        description: "Đơn hàng đã được hủy theo yêu cầu.",
        date: updatedAt,
        Icon: X,
      },
    ];

    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {cancelledSteps.map((step, stepIdx) => (
            <li key={step.title}>
              <div className="relative pb-8">
                {stepIdx !== cancelledSteps.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-px bg-[var(--color-border)]"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex gap-3">
                  <div>
                    <span className="h-8 w-8 flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]">
                      <step.Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1 flex justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
                        {step.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {step.description}
                      </p>
                    </div>
                    {step.date && (
                      <div className="text-right text-[11px] font-mono whitespace-nowrap text-[var(--color-text-muted)]">
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

  const steps = [
    {
      key: "pending",
      title: "Đặt hàng thành công",
      description: "Đơn hàng của bạn đã được tiếp nhận.",
      Icon: ClipboardList,
      targetStatuses: ["pending", "confirmed", "shipping", "delivered"],
      getDate: () => createdAt,
    },
    {
      key: "confirmed",
      title: "Đã xác nhận",
      description: "Người bán đang chuẩn bị hàng gửi cho bạn.",
      Icon: Package,
      targetStatuses: ["confirmed", "shipping", "delivered"],
      getDate: () =>
        ["confirmed", "shipping", "delivered"].includes(status)
          ? updatedAt
          : null,
    },
    {
      key: "shipping_carrier",
      title: "Đã bàn giao vận chuyển",
      description: "Đơn vị vận chuyển đã nhận kiện hàng.",
      Icon: Truck,
      targetStatuses: ["shipping", "delivered"],
      getDate: () =>
        ["shipping", "delivered"].includes(status) ? updatedAt : null,
    },
    {
      key: "shipping",
      title: "Đang giao hàng",
      description: "Đơn hàng đang trên đường giao đến địa chỉ nhận.",
      Icon: Truck,
      targetStatuses: ["shipping", "delivered"],
      getDate: () =>
        ["shipping", "delivered"].includes(status) ? updatedAt : null,
    },
    {
      key: "delivered",
      title: "Giao hàng thành công",
      description: "Đơn hàng đã được giao thành công.",
      Icon: Smile,
      targetStatuses: ["delivered"],
      getDate: () => (status === "delivered" ? updatedAt : null),
    },
  ];

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.targetStatuses.includes(status);
          const date = step.getDate();

          return (
            <li key={step.title}>
              <div className="relative pb-8">
                {stepIdx !== steps.length - 1 ? (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-px ${
                      isCompleted
                        ? "bg-[var(--color-text)]"
                        : "bg-[var(--color-border)]"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex gap-3">
                  <div>
                    <span
                      className={`h-8 w-8 flex items-center justify-center border transition-colors ${
                        isCompleted
                          ? "bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]"
                          : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                      }`}
                    >
                      {isCompleted ? (
                        <Check
                          className="w-4 h-4 stroke-[2.5]"
                          aria-hidden="true"
                        />
                      ) : (
                        <step.Icon className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1 flex justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs uppercase tracking-wider ${
                          isCompleted
                            ? "text-[var(--color-text)] font-semibold"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {step.description}
                      </p>
                    </div>
                    {date && (
                      <div className="text-right text-[11px] font-mono whitespace-nowrap text-[var(--color-text-muted)]">
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
