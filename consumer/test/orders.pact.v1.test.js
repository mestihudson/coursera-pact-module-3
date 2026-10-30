const path = require('path');
const { PactV4, MatchersV3 } = require('@pact-foundation/pact');
const { OrdersClient } = require('../src/ordersClient');

const { decimal, iso8601DateTime, string } = MatchersV3;

/**
 * Contract of the Orders API - **version 1**.
 *
 * The response does NOT contain `discountCode`. This is the contract the
 * consumers already in production depend on, so it must keep being satisfied
 * forever.
 *
 * The pact is written to `pacts/v1` so that v1 and v2 live side by side as two
 * versions of the *same* consumer/provider pair - which is what the Broker
 * stores, tagged `v1` and `v2`.
 */
const provider = new PactV4({
  consumer: 'OrdersConsumer',
  provider: 'OrdersProvider',
  dir: path.resolve(__dirname, '..', 'pacts', 'v1'),
  logLevel: 'warn',
});

describe('Orders API contract - v1', () => {
  it('returns an order without the discountCode field', async () => {
    await provider
      .addInteraction()
      .given('order 1001 exists')
      .uponReceiving('a request for order 1001')
      .withRequest('GET', '/orders/1001')
      .willRespondWith(200, (builder) => {
        builder.headers({ 'Content-Type': 'application/json' });
        builder.jsonBody({
          orderId: string('1001'),
          customerId: string('CUST-77'),
          status: string('CONFIRMED'),
          total: decimal(199.9),
          currency: string('BRL'),
          createdAt: iso8601DateTime('2026-10-30T12:00:00Z'),
        });
      })
      .executeTest(async (mockServer) => {
        const client = new OrdersClient(mockServer.url);
        const order = await client.getOrderV1('1001');

        expect(order.orderId).toBe('1001');
        expect(order.status).toBe('CONFIRMED');
        expect(order).not.toHaveProperty('discountCode');
      });
  });
});
