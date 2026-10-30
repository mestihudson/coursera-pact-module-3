# coursera-pact-module-3

Módulo 3 do curso — **Advanced Contract Testing Implementation**: versionamento
de API e contratos de mensageria assíncrona.

## Cenário

Plataforma de e-commerce. O microsserviço **Orders** introduziu uma nova
versão da API (`/v2/orders/:id`) que adiciona o campo `discountCode`, e ao
mesmo tempo publica o evento assíncrono **Order Shipped** em uma fila,
consumido pelo microsserviço **Shipping**.

## Estrutura

```
consumer/
  src/ordersClient.js               # cliente da Orders API (leitor tolerante)
  test/orders.pact.v1.test.js       # contrato v1 (sem discountCode)
  test/orders.pact.v2.test.js       # contrato v2 (com discountCode)
  test/order-shipped.pact.test.js   # contrato assíncrono do evento
provider/
  src/server.js                     # Orders API v1 e v2
  src/orderShippedPublisher.js      # publicador do evento Order Shipped
  test/orders.verify.test.js        # verificação v1+v2 a partir dos pact files
  test/orders.broker.verify.test.js # verificação v1+v2 a partir do Broker
  test/order-shipped.verify.test.js # verificação do contrato assíncrono
  test/order-shipped.broker.verify.test.js
  test/orders.breaking.test.js      # detecção de breaking change
docs/
  STRATEGY-NOTE.md                  # Step 4 da atividade
  REFLECTION.md                     # Step 1 da atividade
evidence/                           # prints do Broker e logs de execução
```

## Como executar localmente

```bash
docker compose up -d                     # Pact Broker em http://localhost:9293
(cd consumer && npm ci && npm test)      # gera os 3 contratos
(cd consumer && npm run publish:pact)    # publica v1, v2 e async no Broker
(cd provider && npm ci && npm test)      # verifica v1, v2 e o evento
```

O `can-i-deploy` é executado contra o Broker:

```bash
cd provider
npx pact broker can-i-deploy \
  --pacticipant OrdersProvider --version 1.0.0 \
  --to-environment production \
  --broker-base-url http://localhost:9293
```

## Contratos gerados

| Contrato | Consumer | Provider | Tag | Conteúdo |
|----------|----------|----------|-----|----------|
| API v1 | `OrdersConsumer` | `OrdersProvider` | `v1` | `GET /orders/1001` — `orderId`, `customerId`, `status`, `total`, `currency`, `createdAt` |
| API v2 | `OrdersConsumer` | `OrdersProvider` | `v2` | `GET /v2/orders/1001` — os mesmos campos **+** `discountCode` |
| Async | `ShippingService` | `OrdersProvider` | `async` | evento `Order Shipped` — `orderId`, `shippingProvider`, `shippedAt` |

## Pontos de atenção

- **Isolamento do verifier.** O `pact-core` lê `PACT_BROKER_BASE_URL` do
  ambiente e, quando presente, adiciona o Broker como fonte extra de pacts —
  o que faria a verificação HTTP puxar o contrato assíncrono (e vice-versa).
  Por isso cada verificação roda em processo próprio (`npm run test:api`,
  `test:async`, ...) e o helper `provider/test/helpers/withoutBrokerEnv.js`
  remove as variáveis do Broker nos testes que usam pact files locais.
- **Contratos no repositório.** Ao contrário do módulo 2, aqui os pact files
  são versionados (`consumer/pacts/`), porque a atividade pede o envio dos
  arquivos de contrato v1, v2 e assíncrono.
