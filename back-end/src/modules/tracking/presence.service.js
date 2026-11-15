import mongoose from "mongoose";
import { getRedisConnection } from "../../configs/redis.js";
import UserEvent from "./userEvent.model.js";
import User from "../users/user.model.js";
import { PRESENCE_STATUS, USER_ACTIVITY_CONFIG } from "./tracking.constants.js";

const KEY_PREFIX_TAB = "webfashion:presence:session:";
const KEY_ACTIVE_SESSIONS = "webfashion:presence:active-sessions";
const TAB_TTL_SECONDS = Math.ceil(USER_ACTIVITY_CONFIG.heartbeatGraceMs / 1000); // 90 seconds

/**
 * Che giấu email theo chuẩn bảo mật & quyền riêng tư (Masked Email)
 * Ví dụ: customer@404studio.vn -> c******r@404studio.vn
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== "string" || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${"*".repeat(Math.max(1, local.length - 2))}${last}@${domain}`;
};

/**
 * Lọc các trường tài khoản được phép hiển thị (Allowlist Sanitization)
 * Tuyệt đối không trả về password, password hash, tokens hay thông tin thanh toán
 */
export const sanitizeUserAccount = (user) => {
  if (!user) return null;
  const email = user.email || null;
  const userId = user._id ? user._id.toString() : (user.userId ? String(user.userId) : null);
  return {
    userId,
    fullName: user.fullName || "Thành viên",
    username: email ? email.split("@")[0] : null,
    email: maskEmail(email),
    avatarUrl: user.avatar_url || null,
    role: user.role || "user",
    status: user.status || "active",
    createdAt: user.createdAt || null,
  };
};

class PresenceService {
  /**
   * Cập nhật nhịp tim (Heartbeat) và trạng thái hiện diện thời gian thực của người dùng
   * Lưu trữ trên Redis có TTL = 90 giây; KHÔNG ghi bản ghi sự kiện thừa thãi vào MongoDB.
   */
  async updateHeartbeat(data, reqUser) {
    const {
      session_id,
      tab_id,
      anonymous_id,
      status,
      current_route,
      previous_route,
      idle_duration_sec,
      session_duration_sec,
      entry_source,
      traffic_channel,
      last_action,
      last_api,
      visible,
      timestamp,
    } = data;

    const redis = getRedisConnection();
    if (!redis) {
      return { success: false, warning: "Redis unavailable" };
    }

    const userId = reqUser?._id ? reqUser._id.toString() : (reqUser?.userId || reqUser?.id || null);
    const userRole = reqUser?.role || "guest";
    const userType = userId ? "authenticated" : "guest";
    const resolvedAnonymousId = anonymous_id || null;

    let userAccount = null;
    let resolvedUserDisplay = "Khách vãng lai";
    let resolvedUserRole = userRole;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const userDoc = await User.findById(userId)
          .select("_id fullName email role status avatar_url createdAt")
          .lean();
        if (userDoc) {
          userAccount = sanitizeUserAccount(userDoc);
          resolvedUserDisplay = userAccount.fullName;
          resolvedUserRole = userAccount.role;
        } else {
          resolvedUserDisplay = `User ${userId.slice(-6)}`;
        }
      } catch (userErr) {
        console.warn("[Presence] Lỗi khi tra cứu tài khoản User:", userErr.message);
        resolvedUserDisplay = `User ${userId.slice(-6)}`;
      }
    }

    const now = Date.now();
    const tabPayload = {
      sessionId: session_id,
      tabId: tab_id,
      userId: userId || null,
      userDisplay: resolvedUserDisplay,
      account: userAccount || null,
      anonymousId: resolvedAnonymousId,
      userRole: resolvedUserRole,
      userType,
      status: status || PRESENCE_STATUS.ACTIVE,
      currentRoute: current_route || "/",
      previousRoute: previous_route || null,
      idleDurationSec: typeof idle_duration_sec === "number" ? Math.max(0, idle_duration_sec) : 0,
      sessionDurationSec: typeof session_duration_sec === "number" ? Math.max(0, session_duration_sec) : 0,
      entrySource: entry_source || "Direct / Unknown",
      trafficChannel: traffic_channel || "Direct",
      lastAction: last_action || "active_viewing",
      lastApi: last_api || null,
      visible: visible !== false,
      lastHeartbeatAt: now,
      timestamp: timestamp || now,
    };

    const tabKey = `${KEY_PREFIX_TAB}${session_id}:tab:${tab_id}`;
    const tabsSetKey = `${KEY_PREFIX_TAB}${session_id}:tabs`;

    const multi = redis.multi();
    multi.set(tabKey, JSON.stringify(tabPayload), "EX", TAB_TTL_SECONDS);
    multi.sadd(KEY_ACTIVE_SESSIONS, session_id);
    multi.sadd(tabsSetKey, tab_id);
    multi.expire(tabsSetKey, TAB_TTL_SECONDS + 30);
    multi.expire(KEY_ACTIVE_SESSIONS, 86400); // 24h safety refresh
    await multi.exec();

    // Do not start a lazy Socket.IO import from isolated unit tests; it creates
    // a module handle after Jest teardown. Production still broadcasts normally.
    if (process.env.NODE_ENV !== "test") try {
      const { getSocketIO } = await import("../../sockets/index.js");
      const io = getSocketIO();
      if (io) {
        io.to("admin-room").emit("presence:updated", tabPayload);
      }
    } catch {
      // Bỏ qua nếu socket chưa khởi tạo (vd: môi trường unit test)
    }

    return { success: true };
  }

  /**
   * Tách danh tính tài khoản khi người dùng đăng xuất (Logout Disassociation)
   */
  async disassociateUserSession({ session_id, tab_id }) {
    const redis = getRedisConnection();
    if (!redis) return { success: false };

    try {
      const tabsSetKey = `${KEY_PREFIX_TAB}${session_id}:tabs`;
      const tabIds = tab_id ? [tab_id] : await redis.smembers(tabsSetKey);

      for (const tid of tabIds) {
        const tabKey = `${KEY_PREFIX_TAB}${session_id}:tab:${tid}`;
        const raw = await redis.get(tabKey);
        if (raw) {
          const tab = JSON.parse(raw);
          tab.userId = null;
          tab.account = null;
          tab.userType = "guest";
          tab.userRole = "guest";
          tab.userDisplay = "Khách vãng lai";
          tab.lastHeartbeatAt = Date.now();
          await redis.set(tabKey, JSON.stringify(tab), "EX", TAB_TTL_SECONDS);

          try {
            const { getSocketIO } = await import("../../sockets/index.js");
            const io = getSocketIO();
            if (io) {
              io.to("admin-room").emit("presence:updated", tab);
            }
          } catch {}
        }
      }
      return { success: true };
    } catch (err) {
      console.warn("[Presence] Lỗi khi tách danh tính session:", err.message);
      return { success: false };
    }
  }

  /**
   * Xử lý khi tab đóng hoặc rời trang (Beacon leave)
   */
  async handleTabLeave({ session_id, tab_id, reason, final_timings }) {
    const redis = getRedisConnection();
    if (!redis) return { success: false };

    const tabKey = `${KEY_PREFIX_TAB}${session_id}:tab:${tab_id}`;
    const tabsSetKey = `${KEY_PREFIX_TAB}${session_id}:tabs`;

    try {
      await redis.del(tabKey);
      await redis.srem(tabsSetKey, tab_id);

      // Kiểm tra xem session còn tab nào khác không
      const remainingTabs = await redis.smembers(tabsSetKey);
      let sessionEnded = false;
      if (!remainingTabs || remainingTabs.length === 0) {
        await redis.srem(KEY_ACTIVE_SESSIONS, session_id);
        await redis.del(tabsSetKey);
        sessionEnded = true;
      }

      // Phát thông báo tab leave tới Admin room qua Socket.IO
      try {
        const { getSocketIO } = await import("../../sockets/index.js");
        const io = getSocketIO();
        if (io) {
          io.to("admin-room").emit("presence:leave", {
            sessionId: session_id,
            tabId: tab_id,
            reason: reason || "tab_closed",
            sessionEnded,
          });
        }
      } catch {}

      return { success: true };
    } catch (err) {
      console.warn("[Presence] Lỗi khi xử lý tab leave:", err.message);
      return { success: false };
    }
  }

  /**
   * Tổng hợp danh sách phiên người dùng đang hoạt động (Live Sessions) cho Admin
   */
  async getLiveSessions({ statusFilter, routeFilter, limit = 50 }) {
    const redis = getRedisConnection();
    if (!redis) {
      return {
        sessions: [],
        counts: {
          total: 0,
          active: 0,
          idle: 0,
          away: 0,
          background: 0,
          disconnected: 0,
        },
        redisConnected: false,
      };
    }

    const sessionIds = await redis.smembers(KEY_ACTIVE_SESSIONS);
    if (!sessionIds || sessionIds.length === 0) {
      return {
        sessions: [],
        counts: {
          total: 0,
          active: 0,
          idle: 0,
          away: 0,
          background: 0,
          disconnected: 0,
        },
        redisConnected: true,
      };
    }

    const aggregatedSessions = [];
    const counts = {
      total: 0,
      active: 0,
      idle: 0,
      away: 0,
      background: 0,
      disconnected: 0,
      guestCount: 0,
      authenticatedCount: 0,
    };

    const staleSessionsToRemove = [];

    for (const sid of sessionIds) {
      const tabsSetKey = `${KEY_PREFIX_TAB}${sid}:tabs`;
      const tabIds = await redis.smembers(tabsSetKey);

      if (!tabIds || tabIds.length === 0) {
        staleSessionsToRemove.push(sid);
        continue;
      }

      const tabKeys = tabIds.map((tid) => `${KEY_PREFIX_TAB}${sid}:tab:${tid}`);
      const tabsDataRaw = await redis.mget(...tabKeys);

      const activeTabs = [];
      const expiredTabIds = [];

      for (let i = 0; i < tabIds.length; i++) {
        const raw = tabsDataRaw[i];
        if (raw) {
          try {
            activeTabs.push(JSON.parse(raw));
          } catch {
            expiredTabIds.push(tabIds[i]);
          }
        } else {
          expiredTabIds.push(tabIds[i]);
        }
      }

      if (expiredTabIds.length > 0) {
        await redis.srem(tabsSetKey, ...expiredTabIds);
      }

      if (activeTabs.length === 0) {
        staleSessionsToRemove.push(sid);
        continue;
      }

      // Xác định trạng thái tổng thể phiên từ nhiều tab:
      // ACTIVE > PASSIVE_VIEWING > IDLE > AWAY > BACKGROUND > DISCONNECTED
      let overallStatus = PRESENCE_STATUS.DISCONNECTED;
      if (activeTabs.some((t) => t.status === PRESENCE_STATUS.ACTIVE)) {
        overallStatus = PRESENCE_STATUS.ACTIVE;
      } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.PASSIVE_VIEWING)) {
        overallStatus = PRESENCE_STATUS.PASSIVE_VIEWING;
      } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.IDLE)) {
        overallStatus = PRESENCE_STATUS.IDLE;
      } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.AWAY)) {
        overallStatus = PRESENCE_STATUS.AWAY;
      } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.BACKGROUND)) {
        overallStatus = PRESENCE_STATUS.BACKGROUND;
      }

      // Chọn tab đại diện hiển thị (ưu tiên tab đang tương tác tích cực nhất)
      const primaryTab =
        activeTabs.find((t) => t.status === overallStatus) || activeTabs[0];

      // Đếm metrics
      counts.total++;
      if (overallStatus === PRESENCE_STATUS.ACTIVE) counts.active++;
      else if (overallStatus === PRESENCE_STATUS.IDLE) counts.idle++;
      else if (overallStatus === PRESENCE_STATUS.AWAY) counts.away++;
      else if (overallStatus === PRESENCE_STATUS.BACKGROUND) counts.background++;
      else counts.disconnected++;

      if (primaryTab.userType === "authenticated") {
        counts.authenticatedCount++;
      } else {
        counts.guestCount++;
      }

      // Lọc theo điều kiện truy vấn nếu có
      if (statusFilter && statusFilter !== "ALL" && overallStatus !== statusFilter) {
        continue;
      }

      if (
        routeFilter &&
        !primaryTab.currentRoute.toLowerCase().includes(routeFilter.toLowerCase())
      ) {
        continue;
      }

      aggregatedSessions.push({
        sessionId: sid,
        tabCount: activeTabs.length,
        userId: primaryTab.userId || null,
        userDisplay: primaryTab.userDisplay || null,
        account: primaryTab.account || null,
        anonymousId: primaryTab.anonymousId || null,
        userType: primaryTab.userType || "guest",
        userRole: primaryTab.userRole || "guest",
        overallStatus,
        currentRoute: primaryTab.currentRoute,
        previousRoute: primaryTab.previousRoute,
        idleDurationSec: primaryTab.idleDurationSec,
        sessionDurationSec: primaryTab.sessionDurationSec,
        entrySource: primaryTab.entrySource,
        trafficChannel: primaryTab.trafficChannel,
        lastAction: primaryTab.lastAction,
        lastApi: primaryTab.lastApi,
        lastHeartbeatAt: primaryTab.lastHeartbeatAt,
        tabs: activeTabs.map((t) => ({
          tabId: t.tabId,
          status: t.status,
          currentRoute: t.currentRoute,
          idleDurationSec: t.idleDurationSec,
          visible: t.visible,
        })),
      });

      if (aggregatedSessions.length >= limit) break;
    }

    // Tra cứu danh tính thực tế từ MongoDB Users cho các phiên đã xác thực (Real Data Correlation)
    const authUserIds = [...new Set(aggregatedSessions.map((s) => s.userId).filter(Boolean))];
    if (authUserIds.length > 0) {
      try {
        const validIds = authUserIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        const userDocs = await User.find({ _id: { $in: validIds } })
          .select("_id fullName email role status avatar_url createdAt")
          .lean();
        const userMap = new Map();
        userDocs.forEach((u) => userMap.set(u._id.toString(), sanitizeUserAccount(u)));

        for (const s of aggregatedSessions) {
          if (s.userId) {
            const acc = userMap.get(s.userId);
            if (acc) {
              s.account = acc;
              s.userDisplay = acc.fullName;
              s.userRole = acc.role;
              s.userType = "authenticated";
            } else {
              s.account = {
                error: "Không thể tải thông tin tài khoản",
                userId: s.userId,
              };
              s.userDisplay = `User ${s.userId.slice(-6)}`;
              s.userType = "authenticated";
            }
          } else {
            s.account = null;
            s.userType = "guest";
            s.userDisplay = "Khách vãng lai";
          }
        }
      } catch (err) {
        console.warn("[Presence] Lỗi khi batch query User từ MongoDB:", err.message);
      }
    } else {
      for (const s of aggregatedSessions) {
        s.account = null;
        s.userType = "guest";
        s.userDisplay = "Khách vãng lai";
      }
    }

    // Dọn dẹp các session không còn tab nào
    if (staleSessionsToRemove.length > 0) {
      await redis.srem(KEY_ACTIVE_SESSIONS, ...staleSessionsToRemove);
    }

    // Sắp xếp session ưu tiên: ACTIVE -> IDLE -> AWAY -> BACKGROUND
    const statusOrder = {
      ACTIVE: 1,
      PASSIVE_VIEWING: 2,
      IDLE: 3,
      AWAY: 4,
      BACKGROUND: 5,
      DISCONNECTED: 6,
    };
    aggregatedSessions.sort(
      (a, b) =>
        (statusOrder[a.overallStatus] || 99) - (statusOrder[b.overallStatus] || 99) ||
        b.lastHeartbeatAt - a.lastHeartbeatAt
    );

    return {
      sessions: aggregatedSessions,
      counts,
      redisConnected: true,
    };
  }

  /**
   * Lấy chi tiết dòng thời gian hành trình (User Journey Timeline) của một phiên
   */
  async getSessionTimeline(sessionId) {
    if (!sessionId) {
      return { success: false, message: "Cần cung cấp sessionId" };
    }

    const redis = getRedisConnection();
    let liveTabs = [];
    if (redis) {
      const tabsSetKey = `${KEY_PREFIX_TAB}${sessionId}:tabs`;
      const tabIds = await redis.smembers(tabsSetKey);
      if (tabIds && tabIds.length > 0) {
        const keys = tabIds.map((tid) => `${KEY_PREFIX_TAB}${sessionId}:tab:${tid}`);
        const raw = await redis.mget(...keys);
        liveTabs = raw
          .filter(Boolean)
          .map((item) => {
            try {
              let clean = typeof item === "string" ? item.trim() : "";
              if (clean.startsWith("'") && clean.endsWith("'")) {
                clean = clean.slice(1, -1);
              }
              return JSON.parse(clean);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }
    }

    // Lấy toàn bộ sự kiện đã lưu trong MongoDB cho session này theo thứ tự thời gian tăng dần
    const events = await UserEvent.find({ session_id: sessionId })
      .sort({ createdAt: 1 })
      .lean();

    // Xác định userId từ liveTabs hoặc từ các sự kiện đã lưu
    let sessionUserId = liveTabs.find((t) => t.userId)?.userId || null;
    if (!sessionUserId) {
      const eventWithUser = events.find((e) => e.user_id);
      if (eventWithUser) {
        sessionUserId = eventWithUser.user_id.toString();
      }
    }

    let sessionAccount = null;
    let userType = sessionUserId ? "authenticated" : "guest";
    let userDisplay = sessionUserId ? `User ${sessionUserId.slice(-6)}` : "Khách vãng lai";

    if (sessionUserId) {
      try {
        if (mongoose.Types.ObjectId.isValid(sessionUserId)) {
          const userDoc = await User.findById(sessionUserId)
            .select("_id fullName email role status avatar_url createdAt")
            .lean();
          if (userDoc) {
            sessionAccount = sanitizeUserAccount(userDoc);
            userDisplay = sessionAccount.fullName;
          } else {
            sessionAccount = {
              error: "Không thể tải thông tin tài khoản",
              userId: sessionUserId,
            };
          }
        } else {
          sessionAccount = {
            error: "Không thể tải thông tin tài khoản",
            userId: sessionUserId,
          };
        }
      } catch (userErr) {
        sessionAccount = {
          error: "Không thể tải thông tin tài khoản",
          userId: sessionUserId,
        };
      }
    }

    // Tính toán khoảng thời gian trôi qua giữa các bước (+seconds) và liên kết API
    const timeline = [];
    let previousTimestamp = null;
    let sessionStartedAt = null;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const evTime = new Date(ev.createdAt).getTime();

      if (!sessionStartedAt) {
        sessionStartedAt = evTime;
      }

      const elapsedFromStartSec = Math.floor((evTime - sessionStartedAt) / 1000);
      const deltaFromPrevSec = previousTimestamp ? Math.floor((evTime - previousTimestamp) / 1000) : 0;
      previousTimestamp = evTime;

      timeline.push({
        eventId: ev.event_id || ev._id.toString(),
        eventType: ev.event_type,
        actionId: ev.action_id || null,
        traceId: ev.trace_id || null,
        tabId: ev.tab_id || null,
        durationMs: ev.duration_ms || null,
        timestamp: ev.createdAt,
        elapsedFromStartSec,
        deltaFromPrevSec,
        pathname: ev.context?.pathname || null,
        fromPath: ev.context?.fromPath || null,
        toPath: ev.context?.toPath || null,
        entrySource: ev.context?.entrySource || null,
        navigationType: ev.context?.navigationType || null,
        api: ev.context?.api || null,
        meta: ev.meta || {},
        persisted: true,
      });
    }

    return {
      success: true,
      sessionId,
      liveTabs,
      eventCount: events.length,
      sessionStartedAt: sessionStartedAt ? new Date(sessionStartedAt) : null,
      userType,
      userId: sessionUserId || null,
      userDisplay,
      account: sessionAccount,
      timeline,
    };
  }

  /**
   * Thống kê tổng hợp hoạt động trang, thời gian tương tác (Page Dwell & Active Time)
   */
  async getActivityAnalytics({ startDate, endDate }) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 86400 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    // 1. Tổng hợp thời gian trên từng trang từ các event page_view / page_leave
    const pageAggregation = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: { $in: ["page_view", "page_enter", "page_leave"] },
          "context.pathname": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$context.pathname",
          views: { $sum: 1 },
          avgDwellSec: {
            $avg: {
              $cond: [
                { $gt: ["$duration_ms", 0] },
                { $divide: ["$duration_ms", 1000] },
                { $divide: [{ $ifNull: ["$context.timing.dwellMs", 0] }, 1000] },
              ],
            },
          },
          avgActiveSec: {
            $avg: {
              $divide: [{ $ifNull: ["$context.timing.activeMs", 0] }, 1000],
            },
          },
          avgIdleSec: {
            $avg: {
              $divide: [{ $ifNull: ["$context.timing.idleMs", 0] }, 1000],
            },
          },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 15 },
    ]);

    // 2. Thống kê nguồn truy cập (Acquisition Sources)
    const trafficSources = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: "session_start",
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$context.entrySource", "Direct / Unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 3. Thống kê độ trễ và độ tin cậy của API từ api_trace
    const apiMetrics = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: { $in: ["api_trace", "api_slow", "api_error"] },
          "context.api.endpoint": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$context.api.endpoint",
          count: { $sum: 1 },
          avgLatencyMs: { $avg: "$context.api.durationMs" },
          slowCount: {
            $sum: {
              $cond: [{ $eq: ["$event_type", "api_slow"] }, 1, 0],
            },
          },
          errorCount: {
            $sum: {
              $cond: [{ $eq: ["$event_type", "api_error"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // 4. Thống kê tỷ lệ bỏ dở giỏ hàng & thanh toán
    const checkoutFunnel = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: {
            $in: [
              "add_to_cart",
              "checkout_started",
              "reservation_created",
              "order_placed",
              "checkout_abandoned",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$event_type",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      period: { start, end },
      pageAnalytics: pageAggregation.map((p) => ({
        pathname: p._id,
        views: p.views,
        avgDwellSec: Math.round((p.avgDwellSec || 0) * 10) / 10,
        avgActiveSec: Math.round((p.avgActiveSec || 0) * 10) / 10,
        avgIdleSec: Math.round((p.avgIdleSec || 0) * 10) / 10,
      })),
      trafficSources: trafficSources.map((s) => ({
        source: s._id,
        count: s.count,
      })),
      apiMetrics: apiMetrics.map((a) => ({
        endpoint: a._id,
        count: a.count,
        avgLatencyMs: Math.round(a.avgLatencyMs || 0),
        slowCount: a.slowCount,
        errorCount: a.errorCount,
      })),
      checkoutFunnel: checkoutFunnel.reduce((acc, it) => {
        acc[it._id] = it.count;
        return acc;
      }, {}),
    };
  }
}

export default new PresenceService();
