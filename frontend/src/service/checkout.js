import { checkoutCart, createOrder, verifyPayment } from './orderApi';

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadCheckoutScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_URL;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(script);
  });

// Opens Razorpay Checkout for an order the backend just created and resolves with the paid order.
// If the buyer closes the window the order stays pending; the backend releases its stock after a timeout.
const openCheckout = (payment) =>
  new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: payment.razorpayKeyId,
      amount: payment.amount,
      currency: payment.currency,
      order_id: payment.razorpayOrderId,
      name: 'AgroLink',
      handler: async (response) => {
        try {
          const verified = await verifyPayment(payment.orderId, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(verified.data);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    checkout.open();
  });

export const buyNow = async (productId, quantity = 1) => {
  await loadCheckoutScript();
  const { data } = await createOrder([{ productId, quantity }]);
  return openCheckout(data);
};

export const buyCart = async () => {
  await loadCheckoutScript();
  const { data } = await checkoutCart();
  return openCheckout(data);
};
