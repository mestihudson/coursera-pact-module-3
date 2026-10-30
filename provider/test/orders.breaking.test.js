const path = require('path');
const { Verifier } = require('@pact-foundation/pact');
const express = require('express');
const { withoutBrokerEnv } = require('./helpers/withoutBrokerEnv');

/**
 * Negative test - **breaking change detection**.
 *
 * A provider that breaks the v1 contract (the `currency` field is removed and
 * `total` becomes a string) MUST fail the verification against the v1 pact:
 * that is the mechanism that protects the consumers still on v1 while the team
 * evolves the API.
 *
 * The test asserts the failure, so the suite stays green while proving that
 * the contract really bites.
 */
const pactDir = path.resolve(__dirname, '..', '..', 'consumer', 'pacts');

describe('Orders API - breaking change detection', () => {
  it('fails the v1 contract when the provider breaks it', async () => {
    const app = express();

    // Breaking change: `currency` removed and `total` changes type.
    app.get('/orders/:id', (_req, res) => {
      res.json({
        orderId: '1001',
        customerId: 'CUST-77',
        status: 'CONFIRMED',
        total: '199.9',
        createdAt: '2026-10-30T12:00:00Z',
      });
    });

    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();

    const options = {
      provider: 'OrdersProvider',
      providerBaseUrl: `http://127.0.0.1:${port}`,
      pactUrls: [path.join(pactDir, 'v1')],
      providerVersion: 'breaking-change',
      logLevel: 'error',
    };

    let failed = false;
    let errorMessage = '';

    try {
      await withoutBrokerEnv(() => new Verifier(options).verifyProvider());
    } catch (error) {
      failed = true;
      errorMessage = error.message;
    }

    await new Promise((resolve) => server.close(resolve));

    expect(failed).toBe(true);
    expect(errorMessage).toMatch(/expected|body|mismatch/i);
  }, 60000);
});
