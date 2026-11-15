import { describe, expect, test } from "vitest";
import { mergeSupportMessages } from "./useSupportChat";

describe("support chat reconnect merge", () => {
  test("keeps missed messages after reconnect and deduplicates the HTTP/socket race", () => {
    const beforeDisconnect = [{
      _id: "message-1",
      content: "Tin cũ",
      createdAt: "2026-11-07T10:00:00.000Z",
    }];
    const missedViaCursor = [{
      _id: "message-2",
      clientMessageId: "remote-2",
      content: "Tin gửi khi mất kết nối",
      createdAt: "2026-11-07T10:01:00.000Z",
    }];

    const afterReconnect = mergeSupportMessages(beforeDisconnect, missedViaCursor);
    const afterSocketAndHttpRace = mergeSupportMessages(afterReconnect, [
      missedViaCursor[0],
      { ...missedViaCursor[0], content: "Tin gửi khi mất kết nối" },
    ]);

    expect(afterSocketAndHttpRace).toHaveLength(2);
    expect(afterSocketAndHttpRace.map((message) => message._id)).toEqual(["message-1", "message-2"]);
  });

  test("replaces an optimistic message with the persisted message sharing clientMessageId", () => {
    const optimistic = {
      _id: "temp-client-1",
      clientMessageId: "client-1",
      content: "Xin chào",
      createdAt: "2026-11-07T10:00:00.000Z",
      isFailed: true,
    };
    const persisted = {
      _id: "message-1",
      clientMessageId: "client-1",
      content: "Xin chào",
      createdAt: "2026-11-07T10:00:01.000Z",
    };

    const messages = mergeSupportMessages([optimistic], [persisted]);

    expect(messages).toEqual([expect.objectContaining(persisted)]);
    expect(messages[0].isFailed).toBe(false);
  });
});
