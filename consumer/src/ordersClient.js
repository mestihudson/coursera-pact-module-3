const axios = require('axios');

/**
 * Client of the Orders microservice.
 *
 * The client is a "tolerant reader": it only reads the fields it knows about
 * and ignores anything else the provider may add to the payload. That is what
 * allows the provider to introduce `discountCode` (API v2) without breaking
 * this client.
 */
class OrdersClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.http = axios.create({ baseURL: baseUrl, timeout: 10000 });
  }

  /** Orders API v1 - payload without `discountCode`. */
  async getOrderV1(orderId) {
    const { data } = await this.http.get(`/orders/${orderId}`);
    return data;
  }

  /** Orders API v2 - payload with `discountCode`. */
  async getOrderV2(orderId) {
    const { data } = await this.http.get(`/v2/orders/${orderId}`);
    return data;
  }

  /**
   * Only the fields the consumer depends on. Unknown fields sent by the
   * provider are ignored on purpose (backward compatible evolution).
   */
  static readOrder(payload) {
    return {
      orderId: payload.orderId,
      customerId: payload.customerId,
      status: payload.status,
      total: payload.total,
      currency: payload.currency,
      createdAt: payload.createdAt,
    };
  }
}

module.exports = { OrdersClient };
