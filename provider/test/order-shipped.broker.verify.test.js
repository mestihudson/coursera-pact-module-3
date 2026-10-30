const path = require('path');
const { MessageProviderPact } = require('@pact-foundation/pact');
const { publishOrderShipped } = require('../src/orderShippedPublisher');

/**
 * Provider verification of the asynchronous `Order Shipped` contract
 * **against the Pact Broker**.
 *
 * The provider pulls the message pact from the Broker (tag `async`) and asks
 * the publisher for a message, which is then matched against the contract.
 */
describe('Order Shipped event - provider verification against the Broker', () => {
  it('publishes messages that conform to the contract on the Broker', async () => {
    const options = {
      provider: 'OrdersProvider',
      pactBrokerUrl: process.env.PACT_BROKER_BASE_URL || 'http://localhost:9293',
      consumerVersionSelectors: [{ tag: 'async' }],
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      logLevel: 'warn',
      publishVerificationResult: process.env.CI === 'true',
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
    };

    if (process.env.PACT_BROKER_USERNAME) {
      options.pactBrokerUsername = process.env.PACT_BROKER_USERNAME;
      options.pactBrokerPassword = process.env.PACT_BROKER_PASSWORD;
    }

    await new MessageProviderPact(options).verify();
  }, 120000);
});
