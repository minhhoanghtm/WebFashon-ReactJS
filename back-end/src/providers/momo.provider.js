export const createMomoPayment = async (orderId, amount) => {
  console.log(`[MoMo Provider] Simulating payment request for order: ${orderId}, amount: ${amount}`);
  return {
    success: true,
    paymentUrl: `${process.env.CLIENT_URL}/payment-success?orderId=${orderId}&provider=momo`,
  };
};
