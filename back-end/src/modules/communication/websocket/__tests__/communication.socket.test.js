import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";

const verify = jest.fn();
const getConversationById = jest.fn();
const sendAdminMessage = jest.fn();
const sendCustomerMessage = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({ default: { verify } }));
jest.unstable_mockModule("../../../users/user.model.js", () => ({
  default: { findById: jest.fn() },
}));
jest.unstable_mockModule("../../conversations/conversation.service.js", () => ({
  default: { getConversationById },
}));
jest.unstable_mockModule("../../supportChat/supportChat.service.js", () => ({
  default: { sendAdminMessage, sendCustomerMessage },
}));

let registerCommunicationSocket;

const createSocket = () => {
  const handlers = new Map();
  return {
    handshake: { auth: { token: "valid-token" }, headers: {} },
    join: jest.fn(), leave: jest.fn(), emit: jest.fn(),
    on: jest.fn((event, handler) => handlers.set(event, handler)),
    handler: (event) => handlers.get(event),
  };
};

beforeAll(async () => {
  ({ registerCommunicationSocket } = await import("../communication.socket.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("conversation:join authorization", () => {
  test("blocks user A from joining user B's room", async () => {
    verify.mockReturnValue({ userId: "user-a", role: "user" });
    getConversationById.mockRejectedValue(new Error("You do not have permission to access this conversation"));
    const socket = createSocket();
    await registerCommunicationSocket({}, socket);
    const callback = jest.fn();

    await socket.handler("conversation:join")("conversation-b", callback);

    expect(socket.join).not.toHaveBeenCalledWith("conversation:conversation-b");
    expect(socket.emit).toHaveBeenCalledWith("conversation:error", expect.objectContaining({ success: false }));
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test("allows the conversation owner", async () => {
    verify.mockReturnValue({ userId: "user-a", role: "user" });
    getConversationById.mockResolvedValue({ _id: "conversation-a", customerId: "user-a" });
    const socket = createSocket();
    await registerCommunicationSocket({}, socket);

    await socket.handler("conversation:join")("conversation-a");

    expect(getConversationById).toHaveBeenCalledWith("conversation-a", { userId: "user-a", role: "user" });
    expect(socket.join).toHaveBeenCalledWith("conversation:conversation-a");
  });

  test("allows an admin", async () => {
    verify.mockReturnValue({ userId: "admin-1", role: "admin" });
    getConversationById.mockResolvedValue({ _id: "conversation-b", customerId: "user-b" });
    const socket = createSocket();
    await registerCommunicationSocket({}, socket);

    await socket.handler("conversation:join")("conversation-b");

    expect(getConversationById).toHaveBeenCalledWith("conversation-b", { userId: "admin-1", role: "admin" });
    expect(socket.join).toHaveBeenCalledWith("conversation:conversation-b");
  });
});

describe("message:new payload", () => {
  const createIo = () => {
    const rooms = new Map();
    return {
      to: jest.fn((room) => {
        if (!rooms.has(room)) rooms.set(room, { emit: jest.fn() });
        return rooms.get(room);
      }),
      room: (name) => rooms.get(name),
    };
  };

  test("customer message reaches admin immediately with { message, conversation }", async () => {
    verify.mockReturnValue({ userId: "customer-1", role: "user" });
    const conversation = { _id: "conversation-1", customerId: "customer-1", status: "waiting_admin" };
    const message = { _id: "message-1", conversationId: "conversation-1", senderType: "user" };
    sendCustomerMessage.mockResolvedValue({ conversationId: "conversation-1", message, conversation });
    const io = createIo();
    const socket = createSocket();
    await registerCommunicationSocket(io, socket);

    await socket.handler("message:send")({ content: "Xin chào", conversationId: "conversation-1" }, jest.fn());

    expect(io.room("conversation:conversation-1").emit).toHaveBeenCalledWith("message:new", { message, conversation });
    expect(io.room("admins").emit).toHaveBeenCalledWith("message:new", { message, conversation });
  });

  test("admin reply reaches customer immediately with { message, conversation }", async () => {
    verify.mockReturnValue({ userId: "admin-1", role: "admin" });
    const conversation = { _id: "conversation-1", customerId: "customer-1", status: "open" };
    const message = { _id: "message-2", conversationId: "conversation-1", senderType: "admin" };
    sendAdminMessage.mockResolvedValue({ conversationId: "conversation-1", message, conversation });
    const io = createIo();
    const socket = createSocket();
    await registerCommunicationSocket(io, socket);

    await socket.handler("message:send")({ content: "Chào bạn", conversationId: "conversation-1" }, jest.fn());

    expect(io.room("conversation:conversation-1").emit).toHaveBeenCalledWith("message:new", { message, conversation });
    expect(io.room("admins")).toBeUndefined();
  });
});
