const ANON_KEY = "webfashion_anonymous_id";
const ANON_TOKEN_KEY = "webfashion_anonymous_token";

let inMemoryAnonymousId = null;
let inMemoryAnonymousToken = null;

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getAnonymousId = () => {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    // Trường hợp private mode chặn localStorage: giữ ID trong biến bộ nhớ
    if (!inMemoryAnonymousId) {
      inMemoryAnonymousId = generateUUID();
    }
    return inMemoryAnonymousId;
  }
};

export const getAnonymousToken = () => {
  try {
    let token = localStorage.getItem(ANON_TOKEN_KEY);
    if (!token) {
      token = generateUUID();
      localStorage.setItem(ANON_TOKEN_KEY, token);
    }
    return token;
  } catch {
    if (!inMemoryAnonymousToken) {
      inMemoryAnonymousToken = generateUUID();
    }
    return inMemoryAnonymousToken;
  }
};

export const rotateAnonymousId = () => {
  const newId = generateUUID();
  const newToken = generateUUID();
  inMemoryAnonymousId = newId;
  inMemoryAnonymousToken = newToken;
  try {
    localStorage.setItem(ANON_KEY, newId);
    localStorage.setItem(ANON_TOKEN_KEY, newToken);
  } catch {
    // Bỏ qua lỗi localStorage
  }
  return newId;
};

export default getAnonymousId;
