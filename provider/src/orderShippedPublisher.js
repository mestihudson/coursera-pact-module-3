/**
 * Publisher of the `Order Shipped` event.
 *
 * This is the provider side of the asynchronous contract: whatever this
 * function puts on the queue must match the contract consumed by the Shipping
 * microservice (orderId, shippingProvider, shippedAt).
 */
function publishOrderShipped({ orderId, shippingProvider, shippedAt }) {
  return {
    eventType: 'Order Shipped',
    payload: {
      orderId,
      shippingProvider,
      shippedAt,
    },
  };
}

/** Provider state used by the verification test. */
async function orderShippedStateHandler() {
  return 'order 1001 has been shipped';
}

module.exports = { publishOrderShipped, orderShippedStateHandler };
