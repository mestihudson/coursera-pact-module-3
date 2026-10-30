const express = require('express');

/**
 * Orders microservice.
 *
 * - `GET /orders/:id`    -> API v1 (no `discountCode`)
 * - `GET /v2/orders/:id` -> API v2 (adds `discountCode`)
 *
 * Both endpoints return exactly the same fields for the v1 part of the
 * payload, so the v1 contract stays satisfied while v2 is being introduced.
 */
const seed = () => [
  {
    orderId: '1001',
    customerId: 'CUST-77',
    status: 'CONFIRMED',
    total: 199.9,
    currency: 'BRL',
    createdAt: '2026-10-30T12:00:00Z',
    discountCode: 'BLACKFRIDAY25',
  },
];

function createApp() {
  const app = express();
  let orders = seed();

  const findOrder = (id) => orders.find((o) => o.orderId === id);

  const v1View = (order) => ({
    orderId: order.orderId,
    customerId: order.customerId,
    status: order.status,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt,
  });

  app.get('/orders/:id', (req, res) => {
    const order = findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    return res.json(v1View(order));
  });

  app.get('/v2/orders/:id', (req, res) => {
    const order = findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    return res.json({ ...v1View(order), discountCode: order.discountCode });
  });

  return {
    app,
    setOrders(next) {
      orders = next;
    },
    reset() {
      orders = seed();
    },
  };
}

function startProvider(port = 0) {
  const { app, setOrders, reset } = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, '127.0.0.1', () => {
      resolve({
        server,
        port: server.address().port,
        setOrders,
        reset,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3001);
  startProvider(port).then(({ port: p }) => {
    console.log(`OrdersProvider listening on http://127.0.0.1:${p}`);
  });
}

module.exports = { createApp, startProvider };
