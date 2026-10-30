const path = require('path');
const { Verifier } = require('@pact-foundation/pact');
const { startProvider } = require('../src/server');

/**
 * Provider verification of the Orders API **against the Pact Broker**.
 *
 * The provider pulls the pacts from the Broker using version selectors:
 *
 * - `tag: v1`  -> the contract the consumers in production already depend on
 * - `tag: v2`  -> the new contract with the `discountCode` field
 *
 * Both must pass for the same provider version: that is exactly what
 * "backward compatible" means in practice.
 */
describe('Orders API - provider verification against the Broker', () => {
  let provider;

  beforeAll(async () => {
    provider = await startProvider(0);
  });

  afterAll(async () => {
    await provider.close();
  });

  it('satisfies the v1 and v2 contracts published on the Broker', async () => {
    const options = {
      provider: 'OrdersProvider',
      providerBaseUrl: `http://127.0.0.1:${provider.port}`,
      pactBrokerUrl: process.env.PACT_BROKER_BASE_URL || 'http://localhost:9293',
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      consumerVersionSelectors: [{ tag: 'v1' }, { tag: 'v2' }],
      logLevel: 'warn',
      publishVerificationResult: process.env.CI === 'true',
    };

    if (process.env.PACT_BROKER_USERNAME) {
      options.pactBrokerUsername = process.env.PACT_BROKER_USERNAME;
      options.pactBrokerPassword = process.env.PACT_BROKER_PASSWORD;
    }

    await new Verifier(options).verifyProvider();
  }, 120000);
});
