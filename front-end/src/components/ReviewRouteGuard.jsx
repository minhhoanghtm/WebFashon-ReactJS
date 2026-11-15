import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFeatureFlags from "@/hooks/useFeatureFlags";
import { toast } from "react-toastify";

export const ReviewRouteGuard = ({ children }) => {
  const { isFeatureEnabled, loading } = useFeatureFlags();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isFeatureEnabled("enableReviews")) {
      toast.info("Tính năng đánh giá sản phẩm hiện đang tạm đóng.");
      navigate("/", { replace: true });
    }
  }, [isFeatureEnabled, loading, navigate]);

  if (!loading && !isFeatureEnabled("enableReviews")) {
    return null;
  }

  return children;
};

export default ReviewRouteGuard;
