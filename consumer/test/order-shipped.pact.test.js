const path = require('path');
const { MessageConsumerPact } = require('@pact-foundation/pact');

const pactDir = path.resolve(__dirname, '..', 'pacts');

/**
 * Asynchronous contract of the `Order Shipped` event.
 *
 * The Shipping microservice is the consumer of the event published by the
 * Orders microservice (the provider). The contract pins the payload shape
 * (orderId, shippingProvider, shippedAt) so that a change in the publisher
 * breaks the build of whoever consumes the message, instead of silently
 * breaking the notification flow at runtime.
 */
const provider = new MessageConsumerPact({
  consumer: 'ShippingService',
  provider: 'OrdersProvider',
  dir: pactDir,
  logLevel: 'warn',
});

describe('Order Shipped event contract', () => {
  it('receives an order shipped notification', async () => {
    await provider
      .given('order 1001 has been shipped')
      .expectsToReceive('an order shipped event')
      .withContent({
        orderId: '1001',
        shippingProvider: 'DHL',
        shippedAt: '2026-10-30T12:00:00Z',
      })
      .withMetadata({ contentType: 'application/json' })
      .verify(async (message) => {
        expect(message.contents).toMatchObject({
          orderId: expect.any(String),
          shippingProvider: expect.any(String),
          shippedAt: expect.any(String),
        });
      });
  });
});
