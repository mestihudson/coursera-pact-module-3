const path = require('path');
const { Verifier } = require('@pact-foundation/pact');
const { startProvider } = require('../src/server');
const { withoutBrokerEnv } = require('./helpers/withoutBrokerEnv');

/**
 * Provider verification of the Orders API.
 *
 * The provider must satisfy the **v1** and the **v2** contracts at the same
 * time. That is the whole point of backward compatibility: the new version
 * only adds `discountCode`, it does not remove or change anything the v1
 * consumers rely on.
 */
const pactDir = path.resolve(__dirname, '..', '..', 'consumer', 'pacts');

describe('Orders API - provider verification', () => {
  let provider;

  beforeAll(async () => {
    provider = await startProvider(0);
  });

  afterAll(async () => {
    await provider.close();
  });

  it('satisfies both the v1 and the v2 contracts', async () => {
    const options = {
      provider: 'OrdersProvider',
      providerBaseUrl: `http://127.0.0.1:${provider.port}`,
      pactUrls: [path.join(pactDir, 'v1'), path.join(pactDir, 'v2')],
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      logLevel: 'warn',
      publishVerificationResult: process.env.CI === 'true',
    };

    await withoutBrokerEnv(() => new Verifier(options).verifyProvider());
  }, 60000);
});
