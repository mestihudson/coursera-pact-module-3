# Strategy Note — API versioning and asynchronous messaging contracts

> How the versioning approach keeps the existing consumers stable, how the async
> contract prevents integration failures, and one improvement I would make.

## 1. Versioning and backward compatibility

Every contract version of the Orders API is kept in the Pact Broker under the
same consumer (`OrdersConsumer`) and provider (`OrdersProvider`) pair, tagged
`v1` and `v2`, and the provider verifies **both** in the same run
(`consumerVersionSelectors: [{ tag: 'v1' }, { tag: 'v2' }]`). Version 2 is a
purely additive change — every field of v1 keeps the same name and the same
type, and `discountCode` is only added — so a provider that satisfies v2 also
satisfies v1, and the consumers already in production keep working without a
single change on their side. The client is written as a tolerant reader
(`OrdersClient.readOrder` copies only the fields it knows about), so even if
the provider adds another field later, the consumer does not break. The
guarantee is enforced mechanically rather than by convention: the negative test
`provider/test/orders.breaking.test.js` proves that a provider removing
`currency` or changing the type of `total` fails the v1 verification and would
block the pipeline.

## 2. Asynchronous messaging contract

The `Order Shipped` event has its own contract
(`ShippingService-OrdersProvider.json`), in which the Shipping service declares
the payload it needs to receive — `orderId`, `shippingProvider` and
`shippedAt`. The Orders service verifies that contract as the provider of the
message, so the moment somebody renames a field, changes its type or drops it
from the published event, the provider verification fails in the build instead
of the Shipping service discovering it in production, when a shipment stops
being notified. Because the event is verified with the same pipeline and the
same Broker as the HTTP contracts, the two worlds — synchronous and
asynchronous — share one single source of truth about what the Orders service
promises to its consumers, and the compatibility matrix of the Broker shows
both.

## 3. One improvement I would recommend

Today the consumer publishes each version with a **different**
`--consumer-app-version` (`1.0.0` for v1, `2.0.0` for v2), which works, but
mixes the meaning of "version of the contract" with "version of the
application". I would separate those two concepts explicitly: keep the
`--consumer-app-version` as the build that produced the contract (the commit
SHA, exactly as the async pact already does) and use **tags** (`v1`, `v2`) as
the only selector for the API version, plus a `production` tag per environment.
That would make the deploy gate answer a precise question — "can this build be
promoted to production, given the contracts currently tagged `v1` and `v2`?" —
and would let the team deprecate a version by simply retiring its tag, with
the Broker's matrix telling exactly which consumers still depend on it.
