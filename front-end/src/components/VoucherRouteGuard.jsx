import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFeatureFlags from "@/hooks/useFeatureFlags";
import { toast } from "react-toastify";

export const VoucherRouteGuard = ({ children }) => {
  const { isFeatureEnabled, loading } = useFeatureFlags();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isFeatureEnabled("enableVoucher")) {
      toast.info("Tính năng mã giảm giá và khuyến mãi hiện đang tạm đóng.");
      navigate("/", { replace: true });
    }
  }, [isFeatureEnabled, loading, navigate]);

  if (!loading && !isFeatureEnabled("enableVoucher")) {
    return null;
  }

  return children;
};

export default VoucherRouteGuard;
