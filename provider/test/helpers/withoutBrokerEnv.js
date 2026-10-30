/**
 * Helpers shared by the provider verification tests.
 *
 * `pact-core` reads `PACT_BROKER_BASE_URL` straight from the environment and,
 * when it is present, adds the Broker as an extra source of pacts on top of
 * the ones given explicitly. That makes the HTTP verification pull the
 * asynchronous pact (and vice-versa), and each kind of verification then fails
 * against a provider that only speaks the other protocol.
 *
 * The tests below therefore run each verification against exactly the source
 * they mean: pact files from disk, or the Broker.
 */
function withoutBrokerEnv(fn) {
  const brokerEnv = {
    PACT_BROKER_BASE_URL: process.env.PACT_BROKER_BASE_URL,
    PACT_BROKER_USERNAME: process.env.PACT_BROKER_USERNAME,
    PACT_BROKER_PASSWORD: process.env.PACT_BROKER_PASSWORD,
  };

  delete process.env.PACT_BROKER_BASE_URL;
  delete process.env.PACT_BROKER_USERNAME;
  delete process.env.PACT_BROKER_PASSWORD;

  const restore = () => {
    Object.entries(brokerEnv).forEach(([key, value]) => {
      if (value !== undefined) process.env[key] = value;
    });
  };

  return Promise.resolve()
    .then(fn)
    .finally(restore);
}

module.exports = { withoutBrokerEnv };
