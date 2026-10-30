const path = require('path');
const { MessageProviderPact } = require('@pact-foundation/pact');
const { publishOrderShipped } = require('../src/orderShippedPublisher');
const { withoutBrokerEnv } = require('./helpers/withoutBrokerEnv');

/**
 * Provider verification of the asynchronous `Order Shipped` contract.
 *
 * The Orders service is the provider of the event: this test asks the
 * publisher for a message and checks it against the contract written by the
 * Shipping service (consumer).
 */
const pactDir = path.resolve(__dirname, '..', '..', 'consumer', 'pacts');

describe('Order Shipped event - provider verification', () => {
  it('publishes messages that conform to the consumer contract', async () => {
    const provider = new MessageProviderPact({
      provider: 'OrdersProvider',
      pactUrls: [path.join(pactDir, 'ShippingService-OrdersProvider.json')],
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      logLevel: 'warn',
      messageProviders: {
        'an order shipped event': async () => {
          const event = publishOrderShipped({
            orderId: '1001',
            shippingProvider: 'DHL',
            shippedAt: '2026-10-30T12:00:00Z',
          });
          return event.payload;
        },
      },
      stateHandlers: {
        'order 1001 has been shipped': async () => 'order 1001 shipped',
      },
    });

    await withoutBrokerEnv(() => provider.verify());
  }, 60000);
});
