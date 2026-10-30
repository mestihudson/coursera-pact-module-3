/**
 * Captura os prints do Pact Broker usados nas evidencias da atividade.
 *
 * Uso:
 *   npm i -D playwright
 *   npx playwright install chromium
 *   docker compose up -d
 *   PACT_BROKER_BASE_URL=http://localhost:9293 node evidence/capture-screenshots.js
 *
 * O navegador usado e o que o proprio Playwright gerencia. Para apontar um
 * Chromium ja instalado na maquina, defina PLAYWRIGHT_CHROMIUM_PATH.
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9293';
const OUT = path.resolve(__dirname);

const SHOTS = [
  { file: '01-broker-dashboard.png', url: `${BASE}/` },
  { file: '02-pact-v1.png', url: `${BASE}/pacts/provider/OrdersProvider/consumer/OrdersConsumer/version/1.0.0` },
  { file: '03-pact-v2.png', url: `${BASE}/pacts/provider/OrdersProvider/consumer/OrdersConsumer/version/2.0.0` },
  { file: '04-async-pact.png', url: `${BASE}/pacts/provider/OrdersProvider/consumer/ShippingService/version/1.0.0` },
  { file: '06-provider-pacticipant.png', url: `${BASE}/pacticipants/OrdersProvider` },
];

(async () => {
  const launchOptions = { args: ['--no-sandbox'] };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  for (const shot of SHOTS) {
    await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, shot.file), fullPage: true });
    console.log('saved', shot.file);
  }

  await browser.close();
})();
