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
    session_id: z
      .string()
      .trim()
      .max(100, "session_id tối đa 100 ký tự")
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
        referrer: z.string().max(300).optional().nullable(),
        pathname: z.string().max(300).optional().nullable(),
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
      }),
      anonymous_id: z.string().uuid().optional().nullable(),
    })
    .strict(),
});
