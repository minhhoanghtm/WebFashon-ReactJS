import { z } from "zod";
import mongoose from "mongoose";
import { CLIENT_ALLOWED_EVENT_TYPES, SERVER_ONLY_EVENT_TYPES } from "./tracking.constants.js";

const isValidObjectId = (val) => {
  if (!val) return true;
  return mongoose.Types.ObjectId.isValid(val);
};

const metaPrimitive = z.union([
  z.string().max(200, "Giá trị chuỗi meta tối đa 200 ký tự"),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
]);

const metaItemObject = z.record(z.string().max(50), metaPrimitive);

const metaValue = z.union([
  metaPrimitive,
  z.array(z.union([metaPrimitive, metaItemObject])).max(50),
  metaItemObject,
]);

export const singleEventCoreSchema = z
  .object({
    anonymous_id: z
      .string()
      .trim()
      .uuid("anonymous_id phải đúng định dạng UUID")
      .optional()
      .nullable(),
    anonymous_token: z
      .string()
      .trim()
      .max(100, "anonymous_token tối đa 100 ký tự")
      .optional()
      .nullable(),
    session_id: z
      .string()
      .trim()
      .max(100, "session_id tối đa 100 ký tự")
      .optional()
      .nullable(),
    tab_id: z
      .string()
      .trim()
      .max(100, "tab_id tối đa 100 ký tự")
      .optional()
      .nullable(),
    action_id: z
      .string()
      .trim()
      .max(100, "action_id tối đa 100 ký tự")
      .optional()
      .nullable(),
    trace_id: z
      .string()
      .trim()
      .max(100, "trace_id tối đa 100 ký tự")
      .optional()
      .nullable(),
    duration_ms: z
      .number()
      .min(0)
      .max(86_400_000)
      .optional()
      .nullable(),
    event_id: z
      .string()
      .trim()
      .max(100, "event_id tối đa 100 ký tự")
      .optional()
      .nullable(),
    event_type: z
      .string()
      .trim()
      .optional()
      .nullable(),
    event_name: z
      .string()
      .trim()
      .optional()
      .nullable(),
    timestamp: z
      .union([z.string(), z.number(), z.date()])
      .optional()
      .nullable(),
    created_at: z
      .union([z.string(), z.number(), z.date()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.string(), z.number(), z.date()])
      .optional()
      .nullable(),
    product_id: z
      .string()
      .trim()
      .refine(isValidObjectId, { message: "product_id không phải ObjectId hợp lệ" })
      .optional()
      .nullable(),
    category_id: z
      .string()
      .trim()
      .refine(isValidObjectId, { message: "category_id không phải ObjectId hợp lệ" })
      .optional()
      .nullable(),
    query: z
      .string()
      .trim()
      .max(100, "Từ khóa tìm kiếm tối đa 100 ký tự")
      .optional()
      .nullable(),
    source: z
      .string()
      .trim()
      .max(100, "Nguồn sự kiện (source) tối đa 100 ký tự")
      .optional()
      .nullable(),
    meta: z
      .record(
        z.string().max(50, "Tên thuộc tính meta tối đa 50 ký tự"),
        metaValue
      )
      .optional()
      .default({}),
    context: z
      .object({
        deviceType: z.string().max(50).optional().nullable(),
        referrer: z.string().max(1000).optional().nullable(),
        referrerOrigin: z.string().max(300).optional().nullable(),
        pathname: z.string().max(500).optional().nullable(),
        fromPath: z.string().max(500).optional().nullable(),
        toPath: z.string().max(500).optional().nullable(),
        navigationType: z.string().max(50).optional().nullable(),
        entrySource: z.string().max(100).optional().nullable(),
        trafficChannel: z.string().max(100).optional().nullable(),
        utm: z.record(z.string(), z.any()).optional().nullable(),
        timing: z.record(z.string(), z.any()).optional().nullable(),
        perf: z.record(z.string(), z.any()).optional().nullable(),
        api: z.record(z.string(), z.any()).optional().nullable(),
      })
      .optional()
      .default({}),
  })
  .strict("Request body chứa thuộc tính lạ không được phép")
  .refine(
    (data) => Boolean(data.event_type || data.event_name),
    {
      message: "Yêu cầu phải có trường 'event_type' hoặc 'event_name'",
      path: ["event_type"],
    }
  )
  .refine(
    (data) => {
      const type = (data.event_type || data.event_name || "").trim().toLowerCase();
      return !SERVER_ONLY_EVENT_TYPES.includes(type);
    },
    {
      message:
        "event_type không hợp lệ hoặc chỉ được phép phát sinh từ phía máy chủ (purchase, order_placed, order_cancelled)",
      path: ["event_type"],
    }
  )
  .refine(
    (data) => {
      const type = (data.event_type || data.event_name || "").trim().toLowerCase();
      return CLIENT_ALLOWED_EVENT_TYPES.includes(type);
    },
    {
      message: "event_type không nằm trong danh mục sự kiện được hỗ trợ",
      path: ["event_type"],
    }
  );

const batchEventsSchema = z
  .object({
    events: z
      .array(singleEventCoreSchema)
      .min(1, "Danh sách sự kiện không được rỗng")
      .max(25, "Tối đa 25 sự kiện mỗi lượt gửi theo lô"),
  })
  .strict("Batch request chỉ chấp nhận trường 'events'");

export const trackEventSchema = z.object({
  body: z.union([singleEventCoreSchema, batchEventsSchema]),
});

export const updateConsentSchema = z.object({
  body: z
    .object({
      consent: z.enum(["granted", "denied"], {
        errorMap: () => ({ message: "consent phải là 'granted' hoặc 'denied'" }),
      }).optional(),
      choice: z.enum(["UNKNOWN", "ESSENTIAL_ONLY", "CUSTOM", "ALL_ACCEPTED", "WITHDRAWN", "RECONSENT_REQUIRED"]).optional(),
      categories: z
        .object({
          necessary: z.boolean().optional().default(true),
          analytics: z.boolean().optional().default(false),
          personalization: z.boolean().optional().default(false),
          marketing: z.boolean().optional().default(false),
        })
        .optional(),
      policy_version: z.string().max(20).optional(),
      policyVersion: z.string().max(20).optional(),
      source: z.string().max(50).optional(),
      anonymous_id: z.string().uuid().optional().nullable(),
      anonymous_token: z.string().max(100).optional().nullable(),
    })
    .strict()
    .refine((data) => Boolean(data.consent || data.choice), {
      message: "Yêu cầu phải có trường 'consent' hoặc 'choice'",
    }),
});

export const presenceHeartbeatSchema = z.object({
  body: z
    .object({
      session_id: z.string().trim().min(1, "session_id là bắt buộc"),
      tab_id: z.string().trim().min(1, "tab_id là bắt buộc"),
      anonymous_id: z.string().trim().optional().nullable(),
      initial: z.boolean().optional().nullable(),
      consent_status: z.string().optional().nullable(),
      status: z.enum([
        "ACTIVE",
        "IDLE",
        "AWAY",
        "BACKGROUND",
        "PASSIVE_VIEWING",
        "DISCONNECTED",
        "SESSION_ENDED",
      ]),
      current_route: z.string().max(500).optional().nullable(),
      previous_route: z.string().max(500).optional().nullable(),
      idle_duration_sec: z.number().min(0).optional().nullable(),
      session_duration_sec: z.number().min(0).optional().nullable(),
      entry_source: z.string().max(100).optional().nullable(),
      traffic_channel: z.string().max(100).optional().nullable(),
      last_action: z.string().max(100).optional().nullable(),
      last_api: z.string().max(300).optional().nullable(),
      visible: z.boolean().optional().nullable(),
      timestamp: z.union([z.string(), z.number()]).optional().nullable(),
    })
    .passthrough(),
});

export const presenceLeaveSchema = z.object({
  body: z
    .object({
      session_id: z.string().trim().min(1, "session_id là bắt buộc"),
      tab_id: z.string().trim().min(1, "tab_id là bắt buộc"),
      reason: z.string().max(100).optional().nullable(),
      final_timings: z.record(z.string(), z.any()).optional().nullable(),
    })
    .passthrough(),
});

export const presenceDisassociateSchema = z.object({
  body: z
    .object({
      session_id: z.string().trim().min(1, "session_id là bắt buộc"),
      tab_id: z.string().trim().optional().nullable(),
    })
    .passthrough(),
});
