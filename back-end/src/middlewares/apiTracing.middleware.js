import crypto from "crypto";
import UserEvent from "../modules/tracking/userEvent.model.js";

const generateTraceId = () => {
  return "trc-" + crypto.randomBytes(8).toString("hex");
};

/**
 * Middleware quan sát và tương quan API (API Observability & Correlation Middleware)
 * - Tương quan User Action -> API Request -> API Response thông qua traceId & actionId
 * - Đo lường chính xác thời gian xử lý (durationMs)
 * - Phân loại mã lỗi và cảnh báo API chậm (> 5000ms)
 * - TUYỆT ĐỐI KHÔNG ghi log nội dung request/response body (tránh rò rỉ mật khẩu, thẻ, OTP, thông tin nhạy cảm)
 * - Thiết kế hoàn toàn fail-safe: Lỗi đo lường không bao giờ làm gián đoạn hay ảnh hưởng phản hồi nghiệp vụ
 */
export const apiTracingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const traceId =
    req.headers["x-trace-id"] ||
    req.headers["x-request-id"] ||
    generateTraceId();

  req.traceId = traceId;
  res.setHeader("x-trace-id", traceId);

  // Lắng nghe sự kiện hoàn tất phản hồi HTTP
  res.on("finish", () => {
    try {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;
      const method = req.method;

      // Chuẩn hóa và làm sạch endpoint (loại bỏ params dài, query params chứa token)
      const cleanPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;

      // Không tự ghi nhận API tracking/events/presence/privacy hoặc health check vào MongoDB (tránh đệ quy tự tham chiếu)
      if (
        cleanPath.includes("/presence/") ||
        cleanPath.includes("/events") ||
        cleanPath.includes("/tracking") ||
        cleanPath.includes("/privacy") ||
        cleanPath.includes("/health")
      ) {
        return;
      }

      const sessionId = req.headers["x-session-id"] || null;
      const tabId = req.headers["x-tab-id"] || null;
      const actionId = req.headers["x-action-id"] || null;
      const anonymousId = req.headers["x-anonymous-id"] || null;
      const userId = req.user?.userId || req.user?._id?.toString() || null;

      let errorCategory = null;
      let eventType = "api_trace";

      if (statusCode >= 500) {
        errorCategory = "SERVER_ERROR";
        eventType = "api_error";
      } else if (statusCode >= 400) {
        errorCategory = "CLIENT_ERROR";
        if (statusCode === 408 || statusCode === 504) {
          errorCategory = "TIMEOUT";
          eventType = "api_error";
        }
      }

      if (durationMs >= 15000) {
        errorCategory = "POSSIBLY_STALLED_API";
        eventType = "api_slow";
      } else if (durationMs >= 5000) {
        errorCategory = errorCategory || "SLOW_API";
        eventType = "api_slow";
      }

      // Chỉ lưu trữ vào DB nếu:
      // 1. Có lỗi hoặc cảnh báo chậm (api_slow, api_error)
      // 2. Hoặc request gắn với actionId của người dùng
      // 3. Hoặc lấy mẫu 5% request thành công để vẽ biểu đồ P95/Latency mà không làm nở phình database
      const shouldSampleSuccess = Math.random() < 0.05;
      const isImportantApi =
        cleanPath.includes("/cart") ||
        cleanPath.includes("/order") ||
        cleanPath.includes("/inventory") ||
        cleanPath.includes("/checkout");

      if (
        eventType !== "api_trace" ||
        actionId ||
        isImportantApi ||
        shouldSampleSuccess
      ) {
        if (userId || anonymousId) {
          // Bất đồng bộ fire-and-forget, không await để không làm chậm luồng
          UserEvent.create({
            event_id: "api-" + crypto.randomUUID(),
            user_id: userId ? userId : null,
            anonymous_id: anonymousId,
            session_id: sessionId,
            tab_id: tabId,
            action_id: actionId,
            trace_id: traceId,
            duration_ms: durationMs,
            event_type: eventType,
            source: "backend_tracing",
            context: {
              pathname: req.headers["x-frontend-route"] || null,
              api: {
                endpoint: cleanPath,
                method,
                status: statusCode,
                durationMs,
                errorCategory,
              },
            },
          }).catch(() => {
            // Nuốt lỗi an toàn
          });
        }
      }
    } catch {
      // Fail-safe tuyệt đối
    }
  });

  next();
};

export default apiTracingMiddleware;