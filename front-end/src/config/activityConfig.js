/**
 * Cấu hình ngưỡng thời gian chuẩn hóa cho hệ thống Tracking & Idle Detection
 * 404 Studio — WebFashion
 */

export const USER_ACTIVITY_CONFIG = {
  idleAfterMs: 60_000,          // 60 giây không tương tác -> Trạng thái IDLE
  awayAfterMs: 300_000,         // 300 giây (5 phút) không tương tác -> Trạng thái AWAY ("Treo trang / Không thao tác")
  sessionTimeoutMs: 1_800_000,  // 30 phút không hoạt động -> Hết hạn phiên (SESSION_ENDED)
  heartbeatIntervalMs: 30_000,  // 30 giây gửi nhịp tim Redis
  heartbeatGraceMs: 90_000,     // 90 giây mất tín hiệu -> DISCONNECTED / PRESENCE_UNKNOWN
  interactionThrottleMs: 1_000, // Giới hạn tần suất ghi nhận tương tác 1s
  apiSlowThresholdMs: 5_000,    // API vượt 5s -> Cảnh báo SLOW_API
  apiStalledThresholdMs: 15_000,// API vượt 15s -> Nghi vấn treo POSSIBLY_STALLED_API
  longTaskThresholdMs: 50,      // Main-thread task >= 50ms -> Long task
  uiStallThresholdMs: 3_000,    // Task nghẽn giao diện >= 3000ms -> Nghi vấn UI Stall
};

export const PRESENCE_STATUS = {
  ACTIVE: "ACTIVE",                     // "Đang hoạt động"
  IDLE: "IDLE",                         // "Không hoạt động — mm:ss"
  AWAY: "AWAY",                         // "Treo trang / Không thao tác — mm:ss"
  BACKGROUND: "BACKGROUND",             // "Đang ở tab khác / Background"
  PASSIVE_VIEWING: "PASSIVE_VIEWING",   // "Đang phát nội dung"
  DISCONNECTED: "DISCONNECTED",         // "Mất tín hiệu / Không xác định"
  SESSION_ENDED: "SESSION_ENDED",       // "Kết thúc phiên"
};

export default USER_ACTIVITY_CONFIG;