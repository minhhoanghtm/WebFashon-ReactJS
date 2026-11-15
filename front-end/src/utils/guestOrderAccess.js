const keyFor = (orderId) => `guest-order-token:${orderId}`;
export const saveGuestOrderToken = (orderId, token) => Boolean(orderId && token && (localStorage.setItem(keyFor(orderId), token), true));
export const getGuestOrderToken = (orderId) => localStorage.getItem(keyFor(orderId));
