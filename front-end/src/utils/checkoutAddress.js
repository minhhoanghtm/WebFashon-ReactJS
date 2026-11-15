export const getInitialShippingAddress = (routeState) => {
  const possibleAddress = [routeState?.shippingAddress, routeState?.address, routeState?.deliveryAddress]
    .find((item) => typeof item === "string" && item.trim());
  return possibleAddress || "";
};
