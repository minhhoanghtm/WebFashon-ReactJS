/**
 * UI Performance & Hang Detection Diagnostics Service
 * Phân biệt website bị chậm/đơ kỹ thuật với việc người dùng không thao tác (Idle/Away).
 * Sử dụng PerformanceObserver cho longtask, theo dõi event loop lag và lỗi chưa bắt.
 * 404 Studio — WebFashion
 */

import { USER_ACTIVITY_CONFIG } from "../config/activityConfig";

let observer = null;
let longTasksCount = 0;
let maxLongTaskDuration = 0;
let lastHeartbeatRaf = 0;
let performanceListener = null;

export const performanceService = {
  /**
   * Khởi tạo bộ quan sát hiệu năng trình duyệt
   */
  init(options = {}) {
    if (typeof window === "undefined") return;
    if (options.onSignal) {
      performanceListener = options.onSignal;
    }

    // 1. Giám sát Long Tasks (Main-thread tasks >= 50ms) qua PerformanceObserver chuẩn
    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          // Bỏ qua nếu tab đang ở chế độ background (trình duyệt tự hạ xung nhịp)
          if (document.visibilityState === "hidden") return;

          for (const entry of list.getEntries()) {
            const duration = Math.round(entry.duration);
            longTasksCount++;
            if (duration > maxLongTaskDuration) {
              maxLongTaskDuration = duration;
            }

            // Task nghiêm trọng vượt 3000ms khi trang đang foreground -> Nghi vấn UI Stall
            if (duration >= USER_ACTIVITY_CONFIG.uiStallThresholdMs) {
              if (performanceListener) {
                performanceListener({
                  type: "ui_stall_suspected",
                  durationMs: duration,
                  name: entry.name,
                  startTime: Math.round(entry.startTime),
                });
              }
            } else if (duration >= USER_ACTIVITY_CONFIG.longTaskThresholdMs) {
              // Lấy mẫu tín hiệu long task thông thường (>= 50ms)
              if (Math.random() < 0.2 && performanceListener) {
                performanceListener({
                  type: "ui_long_task",
                  durationMs: duration,
                  name: entry.name,
                });
              }
            }
          }
        });

        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        // Fallback nhẹ nếu longtask không được hỗ trợ bởi trình duyệt
      }
    }

    // 2. Bắt các ngoại lệ không được xử lý (Unhandled Errors & Promise Rejections)
    window.addEventListener("error", (event) => {
      if (performanceListener) {
        performanceListener({
          type: "unhandled_error",
          message: event.message ? String(event.message).slice(0, 200) : "Unknown script error",
          filename: event.filename ? String(event.filename).slice(0, 100) : null,
          lineno: event.lineno,
        });
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      if (performanceListener) {
        const reason = event.reason;
        performanceListener({
          type: "unhandled_rejection",
          message:
            typeof reason === "string"
              ? reason.slice(0, 200)
              : reason?.message
              ? String(reason.message).slice(0, 200)
              : "Unhandled Promise Rejection",
        });
      }
    });

    // 3. Giám sát lag chu trình lặp sự kiện (Event Loop Lag via requestAnimationFrame)
    // Chỉ chạy khi tab visible để không sinh false positive khi trình duyệt throttle tab background
    let lastTime = performance.now();
    const checkLag = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      // Bình thường là 16.6ms (60fps), nếu delta vượt 500ms khi visible -> Có dấu hiệu giật đơ
      if (document.visibilityState === "visible" && delta > 500) {
        if (performanceListener && Math.random() < 0.1) {
          performanceListener({
            type: "ui_frame_lag",
            frameDeltaMs: Math.round(delta),
          });
        }
      }

      lastHeartbeatRaf = requestAnimationFrame(checkLag);
    };

    lastHeartbeatRaf = requestAnimationFrame(checkLag);
  },

  /**
   * Lấy các chỉ số hiệu năng tích lũy và reset cho chu kỳ tiếp theo
   */
  consumeMetrics() {
    const metrics = {
      longTasksCount,
      maxLongTaskDurationMs: maxLongTaskDuration,
    };
    longTasksCount = 0;
    maxLongTaskDuration = 0;
    return metrics;
  },

  /**
   * Dọn dẹp listener
   */
  destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (lastHeartbeatRaf) {
      cancelAnimationFrame(lastHeartbeatRaf);
    }
  },
};

export default performanceService;
