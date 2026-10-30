const path = require('path');
const { PactV4, MatchersV3 } = require('@pact-foundation/pact');
const { OrdersClient } = require('../src/ordersClient');

const { decimal, iso8601DateTime, string } = MatchersV3;

/**
 * Contract of the Orders API - **version 2**.
 *
 * v2 is a purely additive change: every field of v1 is kept with exactly the
 * same name and type, and the new `discountCode` field is added. A provider
 * that satisfies this contract is still expected to satisfy the v1 contract.
 */
const provider = new PactV4({
  consumer: 'OrdersConsumer',
  provider: 'OrdersProvider',
  dir: path.resolve(__dirname, '..', 'pacts', 'v2'),
  logLevel: 'warn',
});

describe('Orders API contract - v2', () => {
  it('returns an order including the new discountCode field', async () => {
    await provider
      .addInteraction()
      .given('order 1001 exists')
      .uponReceiving('a request for order 1001 on API v2')
      .withRequest('GET', '/v2/orders/1001')
      .willRespondWith(200, (builder) => {
        builder.headers({ 'Content-Type': 'application/json' });
        builder.jsonBody({
          orderId: string('1001'),
          customerId: string('CUST-77'),
          status: string('CONFIRMED'),
          total: decimal(199.9),
          currency: string('BRL'),
          createdAt: iso8601DateTime('2026-10-30T12:00:00Z'),
          discountCode: string('BLACKFRIDAY25'),
        });
      })
      .executeTest(async (mockServer) => {
        const client = new OrdersClient(mockServer.url);
        const order = await client.getOrderV2('1001');

        expect(order.orderId).toBe('1001');
        expect(order.total).toBeCloseTo(199.9);
        expect(order.discountCode).toBe('BLACKFRIDAY25');
      });
  });
});
